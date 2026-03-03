# Deploy Frontend Only (Force Rebuild - NO CACHE)
# Use this when you've updated frontend code and need to redeploy

$ErrorActionPreference = "Stop"

Write-Host "RaceFacer Frontend Deployment (NO CACHE)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Get project ID
$projectId = gcloud config get-value project 2>$null
if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "Error: No project set" -ForegroundColor Red
    Write-Host "Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

$region = "us-central1"

Write-Host "Project: $projectId" -ForegroundColor Green
Write-Host "Region: $region" -ForegroundColor Green
Write-Host ""

# Clean up old frontend images
Write-Host "Cleaning up old frontend images..." -ForegroundColor Yellow
gcloud container images delete "gcr.io/$projectId/racefacer-frontend:latest" --quiet --force-delete-tags 2>$null
Write-Host "Old images deleted (if any existed)" -ForegroundColor Gray
Write-Host ""

# Build frontend image with NO CACHE (forces fresh build)
Write-Host "Building frontend image (NO CACHE, FRESH BUILD)..." -ForegroundColor Yellow
gcloud builds submit --config cloudbuild.frontend.yaml --no-source-cache .

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

# Allow unauthenticated access
Write-Host "Setting IAM policy..." -ForegroundColor Yellow
gcloud run services add-iam-policy-binding racefacer-frontend --region=$region --member="allUsers" --role="roles/run.invoker" --quiet

# Get frontend URL
$frontendUrl = gcloud run services describe racefacer-frontend --region=$region --format="value(status.url)"

# Cleanup
Remove-Item "$env:TEMP\frontend.yaml" -ErrorAction SilentlyContinue

# Summary
Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Clear browser cache!" -ForegroundColor Yellow
Write-Host "  Press Ctrl+Shift+R (or Cmd+Shift+R) for hard refresh" -ForegroundColor Yellow
Write-Host ""
Write-Host "Cache-busting measures applied:" -ForegroundColor Cyan
Write-Host "  - Old Docker images deleted" -ForegroundColor Gray
Write-Host "  - Docker build with --no-cache" -ForegroundColor Gray
Write-Host "  - Cloud Build with --no-source-cache" -ForegroundColor Gray
Write-Host "  - Fresh pull of base images (--pull)" -ForegroundColor Gray
Write-Host ""
Write-Host "Verify deployment:" -ForegroundColor Cyan
Write-Host "  curl $frontendUrl/js/core/config.js"
Write-Host ""
