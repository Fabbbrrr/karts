# Quick deployment script for Google Cloud Run (PowerShell)
param(
    [string]$ProjectId = ""
)

$ErrorActionPreference = "Stop"

Write-Host "RaceFacer Google Cloud Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'gcloud' CLI not found" -ForegroundColor Red
    Write-Host "Install: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
$activeAccount = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if ([string]::IsNullOrWhiteSpace($activeAccount)) {
    Write-Host "Error: Not logged in to Google Cloud" -ForegroundColor Red
    Write-Host "Run: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

# Get project ID (allow override via parameter)
if (-not [string]::IsNullOrWhiteSpace($ProjectId)) {
    Write-Host "Setting gcloud project to: $ProjectId" -ForegroundColor Yellow
    gcloud config set project $ProjectId | Out-Null
}
$projectId = gcloud config get-value project 2>$null
if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "Error: No project set" -ForegroundColor Red
    Write-Host "Run: gcloud config set project YOUR_PROJECT_ID or pass -ProjectId" -ForegroundColor Yellow
    exit 1
}

Write-Host "Project: $projectId" -ForegroundColor Green
Write-Host "Account: $(gcloud config get-value account)" -ForegroundColor Green

# Set region
$region = "us-central1"  # Free tier eligible region
Write-Host "Region: $region" -ForegroundColor Green

# Project number (for default Run service account)
$projectNumber = gcloud projects describe $projectId --format="value(projectNumber)"
Write-Host "Project Number: $projectNumber" -ForegroundColor Green

# Configure persistent storage bucket (GCS)
$bucketName = ("{0}-racefacer-storage-{1}" -f $projectId, $region).ToLower()
Write-Host "Configuring storage bucket: gs://$bucketName" -ForegroundColor Yellow

# Create bucket if not exists (robust, suppress terminating errors)
$__prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$global:LASTEXITCODE = 0
gcloud storage buckets describe "gs://$bucketName" *> $null
$__describeExit = $LASTEXITCODE
$ErrorActionPreference = $__prevEap
if ($__describeExit -ne 0) {
    gcloud storage buckets create "gs://$bucketName" --location=$region --uniform-bucket-level-access --quiet
    if ($LASTEXITCODE -ne 0) { Write-Host "Bucket creation failed" -ForegroundColor Red; exit 1 }
}

# Grant Cloud Run default service account access to bucket
$runSa = "$projectNumber-compute@developer.gserviceaccount.com"
gcloud storage buckets add-iam-policy-binding "gs://$bucketName" --member="serviceAccount:$runSa" --role="roles/storage.objectAdmin" --quiet

# Enable required APIs
Write-Host ""
Write-Host "Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com cloudscheduler.googleapis.com --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to enable APIs" -ForegroundColor Red
    exit 1
}

# Build backend image
Write-Host ""
Write-Host "Building backend image..." -ForegroundColor Yellow
gcloud builds submit --config cloudbuild.backend.yaml .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed" -ForegroundColor Red
    exit 1
}

# Deploy backend FIRST to get its URL
Write-Host ""
Write-Host "Deploying backend to Cloud Run..." -ForegroundColor Yellow

# Update backend manifest with project ID
$backendYaml = Get-Content "deployment/gcp/backend.yaml" -Raw
$backendYaml = $backendYaml -replace "PROJECT_ID", $projectId
$backendYaml = $backendYaml -replace "GCS_BUCKET_NAME", $bucketName
$backendYaml | Out-File -FilePath "$env:TEMP\backend.yaml" -Encoding UTF8

gcloud run services replace "$env:TEMP\backend.yaml" --region=$region --platform=managed

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend deployment failed" -ForegroundColor Red
    exit 1
}

# Allow unauthenticated access to backend
Write-Host "Setting IAM policy for backend..." -ForegroundColor Yellow
gcloud run services add-iam-policy-binding racefacer-backend --region=$region --member="allUsers" --role="roles/run.invoker" --quiet

# Get backend URL
$backendUrl = gcloud run services describe racefacer-backend --region=$region --format="value(status.url)"
Write-Host "Backend deployed: $backendUrl" -ForegroundColor Green

# Immediately scale up for this session (manual bring-up), disable throttling for runtime
Write-Host "Bringing backend up now (min-instances=1, no CPU throttling)..." -ForegroundColor Yellow
gcloud run services update racefacer-backend --region=$region --min-instances=1 --no-cpu-throttling

# Clean up untagged container images to reduce storage costs
Write-Host ""
Write-Host "Cleaning up untagged container images..." -ForegroundColor Yellow
$backendDigests = gcloud container images list-tags "gcr.io/$projectId/racefacer-backend" --filter="-tags:*" --format="get(digest)" 2>$null
foreach ($d in $backendDigests) {
    if (-not [string]::IsNullOrWhiteSpace($d)) {
        gcloud container images delete "gcr.io/$projectId/racefacer-backend@$d" --quiet
    }
}
$frontendDigests = gcloud container images list-tags "gcr.io/$projectId/racefacer-frontend" --filter="-tags:*" --format="get(digest)" 2>$null
foreach ($d in $frontendDigests) {
    if (-not [string]::IsNullOrWhiteSpace($d)) {
        gcloud container images delete "gcr.io/$projectId/racefacer-frontend@$d" --quiet
    }
}

# Configure Cloud Scheduler to only scale backend DOWN at 22:05 daily (Australia/Melbourne)
Write-Host ""
Write-Host "Configuring Cloud Scheduler for daily 22:05 scale-down only..." -ForegroundColor Yellow
$schedulerSa = "scheduler-runner@$projectId.iam.gserviceaccount.com"

# Create service account if missing
$existingSa = gcloud iam service-accounts list --filter="email=$schedulerSa" --format="value(email)"
if ([string]::IsNullOrWhiteSpace($existingSa)) {
    gcloud iam service-accounts create scheduler-runner --display-name "Scheduler Runner"
}

# Grant necessary roles
gcloud projects add-iam-policy-binding $projectId --member="serviceAccount:$schedulerSa" --role="roles/run.admin" --quiet | Out-Null
gcloud projects add-iam-policy-binding $projectId --member="serviceAccount:$schedulerSa" --role="roles/iam.serviceAccountTokenCreator" --quiet | Out-Null

# Target URI (Cloud Run v1 Admin API - patch annotations)
$svcUri = "https://run.googleapis.com/apis/serving.knative.dev/v1/namespaces/$projectId/services/racefacer-backend?updateMask=spec.template.metadata.annotations"
# Load scale-down body
$scaleDownBody = Get-Content "deployment/gcp/scheduler/body-scale-down.json" -Raw

# Ensure no scale-up job exists (suppress NOT_FOUND)
try { gcloud scheduler jobs delete backend-scale-up --location=$region --quiet *> $null } catch {}

# Recreate scale-down job fresh (daily at 22:05) (suppress NOT_FOUND on delete)
try { gcloud scheduler jobs delete backend-scale-down --location=$region --quiet *> $null } catch {}
gcloud scheduler jobs create http backend-scale-down `
    --location=$region `
    --schedule="5 22 * * *" `
    --time-zone="Australia/Melbourne" `
    --http-method=PUT `
    --uri="$svcUri" `
    --headers="Content-Type=application/json,X-HTTP-Method-Override=PATCH" `
    --oidc-service-account-email="$schedulerSa" `
    --message-body="$scaleDownBody"

# Build frontend image with NO CACHE (ensures fresh build with latest code)
Write-Host ""
Write-Host "Building frontend image (no cache + cache-bust for fresh build)..." -ForegroundColor Yellow

# Build without substitutions
gcloud builds submit --config cloudbuild.frontend.yaml .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed" -ForegroundColor Red
    exit 1
}

# Deploy frontend
Write-Host ""
Write-Host "Deploying frontend to Cloud Run..." -ForegroundColor Yellow

# Update frontend manifest with project ID  
$frontendYaml = Get-Content "deployment/gcp/frontend.yaml" -Raw
$frontendYaml = $frontendYaml -replace "PROJECT_ID", $projectId
$frontendYaml | Out-File -FilePath "$env:TEMP\frontend.yaml" -Encoding UTF8

gcloud run services replace "$env:TEMP\frontend.yaml" --region=$region --platform=managed

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend deployment failed" -ForegroundColor Red
    exit 1
}

# Allow unauthenticated access to frontend
Write-Host "Setting IAM policy for frontend..." -ForegroundColor Yellow
gcloud run services add-iam-policy-binding racefacer-frontend --region=$region --member="allUsers" --role="roles/run.invoker" --quiet

# Get frontend URL
$frontendUrl = gcloud run services describe racefacer-frontend --region=$region --format="value(status.url)"
Write-Host "Frontend deployed: $frontendUrl" -ForegroundColor Green

# Cleanup temp files
Remove-Item "$env:TEMP\backend.yaml" -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\frontend.yaml" -ErrorAction SilentlyContinue

# Summary
Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
Write-Host "  Backend:  $backendUrl"
Write-Host "  Frontend: $frontendUrl"
Write-Host ""
Write-Host "The frontend has been built with auto-detecting config." -ForegroundColor Green
Write-Host "  - Production: Uses HTTPS backend automatically" -ForegroundColor Green
Write-Host "  - Development: Uses localhost/WSL HTTP" -ForegroundColor Green
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "  gcloud run logs read racefacer-backend --region=$region --limit=50"
Write-Host "  gcloud run logs read racefacer-frontend --region=$region --limit=50"
Write-Host ""
Write-Host "View services:" -ForegroundColor Cyan
Write-Host "  gcloud run services list --region=$region"
Write-Host ""
Write-Host "IMPORTANT: Clear browser cache when accessing frontend!" -ForegroundColor Yellow
Write-Host "  Press Ctrl+Shift+R or Cmd+Shift+R for hard refresh"
Write-Host ""
Write-Host "Verify config:" -ForegroundColor Cyan
Write-Host "  Invoke-WebRequest '$frontendUrl/js/core/config.js' | Select-String 'getBackendUrl'"
Write-Host ""
