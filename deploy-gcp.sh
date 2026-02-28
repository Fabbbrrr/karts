#!/bin/bash
# Quick deployment script for Google Cloud Run
# NO CACHE - Forces fresh builds every time

set -e

echo "🚀 RaceFacer Google Cloud Deployment (NO CACHE)"
echo "================================================"

# Optional: allow project override via first argument
if [ -n "$1" ]; then
  echo "Setting gcloud project to: $1"
  gcloud config set project "$1" >/dev/null
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: 'gcloud' CLI not found"
    echo "Install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Error: Not logged in to Google Cloud"
    echo "Run: gcloud auth login"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No project set"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "✅ Project: $PROJECT_ID"
echo "✅ Account: $(gcloud config get-value account)"

# Set region
REGION="us-central1"  # Free tier eligible region
echo "✅ Region: $REGION"

# Get project number (for default Cloud Run SA)
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
echo "✅ Project Number: $PROJECT_NUMBER"

# Configure persistent storage bucket (GCS)
BUCKET_NAME="$(echo "${PROJECT_ID}-racefacer-storage-${REGION}" | tr '[:upper:]' '[:lower:]')"
echo "🪣 Configuring storage bucket: gs://${BUCKET_NAME}"

# Create bucket if not exists
if ! gcloud storage buckets describe "gs://${BUCKET_NAME}" >/dev/null 2>&1; then
  gcloud storage buckets create "gs://${BUCKET_NAME}" --location="${REGION}" --uniform-bucket-level-access --quiet
fi

# Grant Cloud Run default service account access to bucket
RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET_NAME}" \
  --member="serviceAccount:${RUN_SA}" \
  --role="roles/storage.objectAdmin" \
  --quiet

# Enable required APIs
echo ""
echo "📦 Enabling required APIs..."
gcloud services enable run.googleapis.com \
    containerregistry.googleapis.com \
    cloudbuild.googleapis.com \
    cloudscheduler.googleapis.com \
    --quiet

# Clean up old images to prevent cache usage
echo ""
echo "🧹 Cleaning up old images..."
echo "Listing existing images..."
gcloud container images list --repository=gcr.io/$PROJECT_ID 2>/dev/null || echo "No images to clean"

# Delete old backend images
gcloud container images delete gcr.io/$PROJECT_ID/racefacer-backend:latest --quiet --force-delete-tags 2>/dev/null || echo "No old backend image"

# Delete old frontend images  
gcloud container images delete gcr.io/$PROJECT_ID/racefacer-frontend:latest --quiet --force-delete-tags 2>/dev/null || echo "No old frontend image"

# Build backend image (NO CACHE)
echo ""
echo "🔨 Building backend image (NO CACHE, FRESH BUILD)..."
gcloud builds submit \
    --config cloudbuild.backend.yaml \
    --no-source-cache \
    .

# Build frontend image (NO CACHE)
echo ""
echo "🔨 Building frontend image (NO CACHE, FRESH BUILD)..."
gcloud builds submit \
    --config cloudbuild.frontend.yaml \
    --no-source-cache \
    .

# Update manifests with project ID
echo ""
echo "📝 Updating deployment manifests..."
sed "s/PROJECT_ID/$PROJECT_ID/g" deployment/gcp/backend.yaml | sed "s/GCS_BUCKET_NAME/${BUCKET_NAME}/g" > /tmp/backend.yaml
sed "s/PROJECT_ID/$PROJECT_ID/g" deployment/gcp/frontend.yaml > /tmp/frontend.yaml

# Deploy backend
echo ""
echo "🚢 Deploying backend to Cloud Run..."
gcloud run services replace /tmp/backend.yaml \
    --region=$REGION \
    --platform=managed

# Allow unauthenticated access
echo "🔓 Setting IAM policy for backend..."
gcloud run services add-iam-policy-binding racefacer-backend \
    --region=$REGION \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --quiet

# Get backend URL
BACKEND_URL=$(gcloud run services describe racefacer-backend \
    --region=$REGION \
    --format='value(status.url)')

echo "✅ Backend deployed: $BACKEND_URL"

# Clean up untagged container images to reduce storage costs
echo ""
echo "🧹 Cleaning up untagged container images..."
for IMAGE in racefacer-backend racefacer-frontend; do
  for DIGEST in $(gcloud container images list-tags "gcr.io/${PROJECT_ID}/${IMAGE}" --filter='-tags:*' --format='get(digest)'); do
    gcloud container images delete "gcr.io/${PROJECT_ID}/${IMAGE}@${DIGEST}" --quiet || true
  done
done

# Configure Cloud Scheduler: daily 22:05 scale-down only (Australia/Melbourne time)
echo ""
echo "⏰ Configuring Cloud Scheduler: daily 22:05 scale-down only..."
SCHEDULER_SA="scheduler-runner@${PROJECT_ID}.iam.gserviceaccount.com"

# Create service account if missing
if ! gcloud iam service-accounts describe "${SCHEDULER_SA}" >/dev/null 2>&1; then
  gcloud iam service-accounts create scheduler-runner --display-name "Scheduler Runner"
fi

# Grant roles
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${SCHEDULER_SA}" --role="roles/run.admin" --quiet
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="serviceAccount:${SCHEDULER_SA}" --role="roles/iam.serviceAccountTokenCreator" --quiet

SERVICE_URI="https://run.googleapis.com/apis/serving.knative.dev/v1/namespaces/${PROJECT_ID}/services/racefacer-backend?updateMask=spec.template.metadata.annotations"
SCALE_DOWN_BODY="$(cat deployment/gcp/scheduler/body-scale-down.json)"

# Ensure no scale-up job exists
gcloud scheduler jobs delete backend-scale-up --location="${REGION}" --quiet || true

# Recreate scale-down job fresh (daily at 22:05 AET)
gcloud scheduler jobs delete backend-scale-down --location="${REGION}" --quiet || true
gcloud scheduler jobs create http backend-scale-down \
  --location="${REGION}" \
  --schedule="5 22 * * *" \
  --time-zone="Australia/Melbourne" \
  --http-method=PUT \
  --uri="${SERVICE_URI}" \
  --headers="Content-Type=application/json,X-HTTP-Method-Override=PATCH" \
  --oidc-service-account-email="${SCHEDULER_SA}" \
  --message-body="${SCALE_DOWN_BODY}"

# Update frontend config with backend URL
echo ""
echo "🔧 Updating frontend config with backend URL..."
sed -i "s|SERVER_URL: '[^']*'|SERVER_URL: '$BACKEND_URL'|g" js/core/config.js
echo "✅ Frontend config updated"

# Deploy frontend
echo ""
echo "🚢 Deploying frontend to Cloud Run..."
gcloud run services replace /tmp/frontend.yaml \
    --region=$REGION \
    --platform=managed

# Allow unauthenticated access
echo "🔓 Setting IAM policy for frontend..."
gcloud run services add-iam-policy-binding racefacer-frontend \
    --region=$REGION \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --quiet

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe racefacer-frontend \
    --region=$REGION \
    --format='value(status.url)')

echo "✅ Frontend deployed: $FRONTEND_URL"

# Cleanup temp files
rm /tmp/backend.yaml /tmp/frontend.yaml

# Summary
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📊 Application URLs:"
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo ""
echo "⚠️  IMPORTANT: Clear browser cache!"
echo "  Press Ctrl+Shift+R (or Cmd+Shift+R) for hard refresh"
echo ""
echo "🔍 View logs:"
echo "  gcloud run logs read racefacer-backend --region=$REGION --limit=50"
echo "  gcloud run logs read racefacer-frontend --region=$REGION --limit=50"
echo ""
echo "📊 View services:"
echo "  gcloud run services list --region=$REGION"
echo ""
echo "🧹 Note: Old Docker images were deleted to prevent cache usage"
echo ""

