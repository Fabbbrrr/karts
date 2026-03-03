#!/bin/bash
# Emergency fix: Force deploy latest frontend config
# This script ensures the latest config.js is deployed

set -e

echo "🚨 Emergency Frontend Deploy (Force Fresh Build)"
echo "================================================"
echo ""

# Check current config
echo "📋 Current local config.js:"
grep -A 2 "function getBackendUrl" js/core/config.js || echo "Function not found"
echo ""

# Verify we have the right config
if ! grep -q "isProduction" js/core/config.js; then
    echo "❌ ERROR: config.js doesn't have auto-detect code!"
    echo "Please ensure js/core/config.js has the isProduction detection"
    exit 1
fi

echo "✅ Config looks good"
echo ""

# Get project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No GCP project set"
    exit 1
fi

echo "📦 Project: $PROJECT_ID"
echo "🔨 Building with CACHEBUST to force fresh image..."
echo ""

# Build with explicit cachebust
CACHEBUST=$(date +%s)

docker build \
    --no-cache \
    --build-arg CACHEBUST=$CACHEBUST \
    -t gcr.io/$PROJECT_ID/racefacer-frontend:latest \
    -f Dockerfile.frontend \
    .

echo ""
echo "📤 Pushing to GCR..."
docker push gcr.io/$PROJECT_ID/racefacer-frontend:latest

echo ""
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy racefacer-frontend \
    --image gcr.io/$PROJECT_ID/racefacer-frontend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Verify config:"
FRONTEND_URL=$(gcloud run services describe racefacer-frontend --region=us-central1 --format="value(status.url)")
echo "URL: $FRONTEND_URL"
echo ""
echo "Check config:"
echo "curl $FRONTEND_URL/js/core/config.js | grep -A 5 'getBackendUrl'"
echo ""
echo "⚠️  IMPORTANT: Hard refresh browser (Ctrl+Shift+R)"


