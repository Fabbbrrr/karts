# Emergency Deploy - Force Fresh Build
# This ensures the latest config.js makes it to production

$ErrorActionPreference = "Stop"

Write-Host "Emergency Frontend Deploy (Force Fresh Build)" -ForegroundColor Red
Write-Host "==============================================" -ForegroundColor Red
Write-Host ""

# Verify config
Write-Host "Checking local config..." -ForegroundColor Yellow
$configContent = Get-Content "js/core/config.js" -Raw
if ($configContent -notmatch "isProduction") {
    Write-Host "ERROR: config.js missing auto-detect code!" -ForegroundColor Red
    exit 1
}
Write-Host "Config looks good" -ForegroundColor Green
Write-Host ""

# Get project
$projectId = gcloud config get-value project 2>$null
if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "Error: No project set" -ForegroundColor Red
    exit 1
}

$region = "us-central1"
$cacheBust = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

Write-Host "Project: $projectId" -ForegroundColor Cyan
Write-Host "Cache Bust: $cacheBust" -ForegroundColor Cyan
Write-Host ""

# Build with explicit cache bust
Write-Host "Building image (no cache, cache-bust arg)..." -ForegroundColor Yellow
docker build `
    --no-cache `
    --build-arg CACHEBUST=$cacheBust `
    -t "gcr.io/$projectId/racefacer-frontend:latest" `
    -f Dockerfile.frontend `
    .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

# Push
Write-Host ""
Write-Host "Pushing to GCR..." -ForegroundColor Yellow
docker push "gcr.io/$projectId/racefacer-frontend:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed!" -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host ""
Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy racefacer-frontend `
    --image "gcr.io/$projectId/racefacer-frontend:latest" `
    --platform managed `
    --region $region `
    --allow-unauthenticated

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deploy failed!" -ForegroundColor Red
    exit 1
}

# Get URL
$frontendUrl = gcloud run services describe racefacer-frontend --region=$region --format="value(status.url)"

Write-Host ""
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Verify config:" -ForegroundColor Yellow
Write-Host "  Invoke-WebRequest '$frontendUrl/js/core/config.js' | Select-String 'getBackendUrl'"
Write-Host ""
Write-Host "CRITICAL: Hard refresh browser!" -ForegroundColor Red
Write-Host "  Windows: Ctrl+Shift+R" -ForegroundColor Red
Write-Host "  Mac: Cmd+Shift+R" -ForegroundColor Red
Write-Host ""


