#!/bin/bash
# RaceFacer Automated Deployment Script
# NO CACHE - Complete fresh deployment to Google Cloud Run
# This script handles EVERYTHING automatically

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Helper functions
print_success() { echo -e "${GREEN}$1${NC}"; }
print_info() { echo -e "${CYAN}$1${NC}"; }
print_warning() { echo -e "${YELLOW}$1${NC}"; }
print_error() { echo -e "${RED}$1${NC}"; }
print_step() { echo -e "\n${MAGENTA}==> $1${NC}"; }

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   RaceFacer Automated Deployment (NO CACHE)               ║${NC}"
echo -e "${CYAN}║   Complete Backend + Frontend Deployment                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# STEP 1: Validation
# ============================================================================
print_step "Step 1/8: Validating environment..."

# Check gcloud CLI
if ! command -v gcloud &> /dev/null; then
    print_error "✗ gcloud CLI not found"
    print_warning "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
GCLOUD_VERSION=$(gcloud version 2>&1 | grep "Google Cloud SDK" || echo "unknown")
print_success "✓ gcloud CLI found: $GCLOUD_VERSION"

# Check if logged in
ACCOUNT=$(gcloud config get-value account 2>/dev/null)
if [ -z "$ACCOUNT" ]; then
    print_error "✗ Not logged in to Google Cloud"
    print_warning "Run: gcloud auth login"
    exit 1
fi
print_success "✓ Logged in as: $ACCOUNT"

# Check project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    print_error "✗ No project set"
    print_warning "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi
print_success "✓ Project: $PROJECT_ID"

REGION="us-central1"
print_success "✓ Region: $REGION"

# ============================================================================
# STEP 2: Enable Required APIs
# ============================================================================
print_step "Step 2/8: Enabling required Google Cloud APIs..."

APIS=(
    "run.googleapis.com"
    "containerregistry.googleapis.com"
    "cloudbuild.googleapis.com"
)

for api in "${APIS[@]}"; do
    echo -n "  Enabling $api..."
    gcloud services enable $api --quiet 2>/dev/null
    print_success " ✓"
done

# ============================================================================
# STEP 3: Clean Up Old Images
# ============================================================================
print_step "Step 3/8: Cleaning up old Docker images..."

echo -n "  Deleting old backend image..."
gcloud container images delete "gcr.io/$PROJECT_ID/racefacer-backend:latest" --quiet --force-delete-tags 2>/dev/null || true
print_success " ✓ (deleted or didn't exist)"

echo -n "  Deleting old frontend image..."
gcloud container images delete "gcr.io/$PROJECT_ID/racefacer-frontend:latest" --quiet --force-delete-tags 2>/dev/null || true
print_success " ✓ (deleted or didn't exist)"

# ============================================================================
# STEP 4: Build Backend Image
# ============================================================================
print_step "Step 4/8: Building backend Docker image (NO CACHE)..."
print_info "This will take 2-4 minutes..."

if ! gcloud builds submit --config cloudbuild.backend.yaml .; then
    print_error "✗ Backend build failed"
    exit 1
fi
print_success "✓ Backend image built successfully"

# ============================================================================
# STEP 5: Deploy Backend
# ============================================================================
print_step "Step 5/8: Deploying backend to Cloud Run..."

# Update backend manifest
sed "s/PROJECT_ID/$PROJECT_ID/g" deployment/gcp/backend.yaml > /tmp/backend.yaml

if ! gcloud run services replace /tmp/backend.yaml --region=$REGION --platform=managed; then
    print_error "✗ Backend deployment failed"
    rm -f /tmp/backend.yaml
    exit 1
fi

# Set IAM policy
echo -n "  Setting public access..."
gcloud run services add-iam-policy-binding racefacer-backend \
    --region=$REGION \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --quiet 2>/dev/null
print_success " ✓"

# Get backend URL
BACKEND_URL=$(gcloud run services describe racefacer-backend \
    --region=$REGION \
    --format='value(status.url)')
print_success "✓ Backend deployed: $BACKEND_URL"

# Cleanup
rm -f /tmp/backend.yaml

# ============================================================================
# STEP 6: Update Frontend Config
# ============================================================================
print_step "Step 6/8: Updating frontend configuration..."

echo -n "  Backing up config..."
cp js/core/config.js js/core/config.js.backup
print_success " ✓"

echo -n "  Updating SERVER_URL to: $BACKEND_URL"
sed -i.tmp "s|SERVER_URL: '[^']*'|SERVER_URL: '$BACKEND_URL'|g" js/core/config.js
rm -f js/core/config.js.tmp
print_success " ✓"

# ============================================================================
# STEP 7: Build Frontend Image
# ============================================================================
print_step "Step 7/8: Building frontend Docker image (NO CACHE)..."
print_info "This will take 1-2 minutes..."

FRONTEND_BUILD_SUCCESS=false
if gcloud builds submit --config cloudbuild.frontend.yaml .; then
    FRONTEND_BUILD_SUCCESS=true
fi

# Restore original config
echo -n "  Restoring original config..."
mv js/core/config.js.backup js/core/config.js
print_success " ✓"

if [ "$FRONTEND_BUILD_SUCCESS" = false ]; then
    print_error "✗ Frontend build failed"
    exit 1
fi
print_success "✓ Frontend image built successfully"

# ============================================================================
# STEP 8: Deploy Frontend
# ============================================================================
print_step "Step 8/8: Deploying frontend to Cloud Run..."

# Update frontend manifest
sed "s/PROJECT_ID/$PROJECT_ID/g" deployment/gcp/frontend.yaml > /tmp/frontend.yaml

if ! gcloud run services replace /tmp/frontend.yaml --region=$REGION --platform=managed; then
    print_error "✗ Frontend deployment failed"
    rm -f /tmp/frontend.yaml
    exit 1
fi

# Set IAM policy
echo -n "  Setting public access..."
gcloud run services add-iam-policy-binding racefacer-frontend \
    --region=$REGION \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --quiet 2>/dev/null
print_success " ✓"

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe racefacer-frontend \
    --region=$REGION \
    --format='value(status.url)')
print_success "✓ Frontend deployed: $FRONTEND_URL"

# Cleanup
rm -f /tmp/frontend.yaml

# ============================================================================
# DEPLOYMENT COMPLETE
# ============================================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                 🎉 DEPLOYMENT COMPLETE! 🎉                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}📊 Deployment Summary${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Backend URL:  ${YELLOW}$BACKEND_URL${NC}"
echo -e "  Frontend URL: ${YELLOW}$FRONTEND_URL${NC}"
echo ""
echo -e "${GRAY}  Project:      $PROJECT_ID${NC}"
echo -e "${GRAY}  Region:       $REGION${NC}"
echo -e "${GRAY}  Account:      $ACCOUNT${NC}"
echo ""

echo -e "${CYAN}🔧 Cache Busting Applied${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GRAY}  ✓ Old Docker images deleted${NC}"
echo -e "${GRAY}  ✓ Docker build with --no-cache${NC}"
echo -e "${GRAY}  ✓ Cloud Build with --no-cache${NC}"
echo -e "${GRAY}  ✓ Fresh pull of base images (--pull)${NC}"
echo -e "${GRAY}  ✓ Unique build IDs per deployment${NC}"
echo -e "${GRAY}  ✓ Frontend config auto-updated${NC}"
echo ""

echo -e "${YELLOW}⚠️  Important Next Steps${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  1. Open your browser to: ${YELLOW}$FRONTEND_URL${NC}"
echo -e "  2. Hard refresh to clear browser cache: Ctrl+Shift+R"
echo -e "  3. Verify the app loads correctly"
echo ""

echo -e "${CYAN}🔍 Useful Commands${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  View backend logs:"
echo -e "${GRAY}    gcloud run logs read racefacer-backend --region=$REGION --limit=50${NC}"
echo ""
echo -e "  View frontend logs:"
echo -e "${GRAY}    gcloud run logs read racefacer-frontend --region=$REGION --limit=50${NC}"
echo ""
echo -e "  List all services:"
echo -e "${GRAY}    gcloud run services list --region=$REGION${NC}"
echo ""
echo -e "  Test backend health:"
echo -e "${GRAY}    curl $BACKEND_URL/health${NC}"
echo ""
echo -e "  Test frontend config:"
echo -e "${GRAY}    curl $FRONTEND_URL/js/core/config.js${NC}"
echo ""

print_success "✨ Deployment completed successfully!"
echo ""




