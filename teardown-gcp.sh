#!/bin/bash
# Teardown script for Google Cloud resources (Bash)
# Usage: ./teardown-gcp.sh [PROJECT_ID] [REGION] [--disable-apis]

set -euo pipefail

PROJECT_ID="${1:-$(gcloud config get-value project 2>/dev/null || true)}"
REGION="${2:-us-central1}"
DISABLE_APIS="${3:-}"

echo "RaceFacer Google Cloud Teardown"
echo "================================"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found"; exit 1
fi

if [[ -z "${PROJECT_ID}" ]]; then
  echo "No project set. Pass PROJECT_ID as first argument or run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"

SCHEDULER_SA="scheduler-runner@${PROJECT_ID}.iam.gserviceaccount.com"
BUCKET_NAME="$(echo "${PROJECT_ID}-racefacer-storage-${REGION}" | tr '[:upper:]' '[:lower:]')"

# 1) Delete Cloud Scheduler jobs
echo ""
echo "Deleting Cloud Scheduler jobs (if exist)..."
gcloud scheduler jobs delete backend-scale-up --location="${REGION}" --quiet || true
gcloud scheduler jobs delete backend-scale-down --location="${REGION}" --quiet || true

# 2) Delete Cloud Run services
echo ""
echo "Deleting Cloud Run services (if exist)..."
gcloud run services delete racefacer-backend --region="${REGION}" --quiet || true
gcloud run services delete racefacer-frontend --region="${REGION}" --quiet || true

# 3) Delete container images (GCR)
echo ""
echo "Deleting container images (if exist)..."
for IMAGE in racefacer-backend racefacer-frontend; do
  for DIGEST in $(gcloud container images list-tags "gcr.io/${PROJECT_ID}/${IMAGE}" --format='get(digest)' 2>/dev/null || true); do
    gcloud container images delete "gcr.io/${PROJECT_ID}/${IMAGE}@${DIGEST}" --quiet || true
  done
  gcloud container images delete "gcr.io/${PROJECT_ID}/${IMAGE}:latest" --quiet --force-delete-tags || true
done

# 4) Delete GCS buckets and contents
echo ""
echo "Deleting GCS buckets and contents (if exist)..."
gcloud storage rm -r "gs://${BUCKET_NAME}" --quiet || true
gcloud storage buckets delete "gs://${BUCKET_NAME}" --quiet || true
gcloud storage rm -r "gs://${PROJECT_ID}_cloudbuild" --quiet || true

# 5) Delete Scheduler service account
echo ""
echo "Deleting Scheduler service account (if exist)..."
gcloud iam service-accounts delete "${SCHEDULER_SA}" --quiet || true

# 6) Optionally disable APIs
if [[ "${DISABLE_APIS}" == "--disable-apis" ]]; then
  echo ""
  echo "Disabling core APIs (can be re-enabled by deploy script)..."
  gcloud services disable run.googleapis.com cloudbuild.googleapis.com cloudscheduler.googleapis.com containerregistry.googleapis.com --quiet || true
fi

echo ""
echo "Teardown completed for project '${PROJECT_ID}' in region '${REGION}'."
echo "You can now run the deploy script to recreate everything from scratch."



