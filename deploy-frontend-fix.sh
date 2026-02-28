 #!/bin/bash
# Deploy updated frontend to GCP Cloud Run
# This ensures the config changes are included

set -e

echo "🔧 Deploying Frontend with Fixed Config..."
echo ""

# Set your GCP project
PROJECT_ID="racefacer-project"
REGION="us-central1"

echo "📦 Building frontend Docker image..."
docker build -f Dockerfile.frontend -t gcr.io/${PROJECT_ID}/racefacer-frontend:latest .

echo ""
echo "📤 Pushing to Google Container Registry..."
docker push gcr.io/${PROJECT_ID}/racefacer-frontend:latest

echo ""
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy racefacer-frontend \
  --image gcr.io/${PROJECT_ID}/racefacer-frontend:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --port 8080

echo ""
echo "✅ Frontend deployed successfully!"
echo ""
echo "🌐 Frontend URL: https://racefacer-frontend-nynn4wphja-uc.a.run.app"
echo "🔗 Backend URL: https://racefacer-backend-nynn4wphja-uc.a.run.app"
echo ""
echo "📋 The config will now auto-detect production and use HTTPS backend"


