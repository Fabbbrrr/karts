# Local Docker build + GCP deployment (for network issues)

$ErrorActionPreference = "Stop"

Write-Host "RaceFacer Google Cloud Deployment (Local Build)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker not found" -ForegroundColor Red
    Write-Host "Install: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'gcloud' CLI not found" -ForegroundColor Red
    exit 1
}

# Get project ID
$projectId = gcloud config get-value project 2>$null
if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "Error: No project set" -ForegroundColor Red
    Write-Host "Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

Write-Host "Project: $projectId" -ForegroundColor Green

# Set region
$region = "us-central1"
Write-Host "Region: $region" -ForegroundColor Green

# Configure Docker for GCP
Write-Host ""
Write-Host "Configuring Docker authentication..." -ForegroundColor Yellow
gcloud auth configure-docker --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to configure Docker" -ForegroundColor Red
    exit 1
}

# Build backend image locally
Write-Host ""
Write-Host "Building backend image locally..." -ForegroundColor Yellow
docker build -t "gcr.io/$projectId/racefacer-backend:latest" -f Dockerfile.backend .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed" -ForegroundColor Red
    exit 1
}

# Push backend image
Write-Host ""
Write-Host "Pushing backend image to GCR..." -ForegroundColor Yellow
docker push "gcr.io/$projectId/racefacer-backend:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend push failed" -ForegroundColor Red
    exit 1
}

# Build frontend image locally
Write-Host ""
Write-Host "Building frontend image locally..." -ForegroundColor Yellow
docker build -t "gcr.io/$projectId/racefacer-frontend:latest" -f Dockerfile.frontend .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed" -ForegroundColor Red
    exit 1
}

# Push frontend image
Write-Host ""
Write-Host "Pushing frontend image to GCR..." -ForegroundColor Yellow
docker push "gcr.io/$projectId/racefacer-frontend:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend push failed" -ForegroundColor Red
    exit 1
}

# Update manifests with project ID
Write-Host ""
Write-Host "Updating deployment manifests..." -ForegroundColor Yellow
$backendYaml = Get-Content "deployment/gcp/backend.yaml" -Raw
$backendYaml = $backendYaml -replace "PROJECT_ID", $projectId
$backendYaml | Out-File -FilePath "$env:TEMP\backend.yaml" -Encoding UTF8

$frontendYaml = Get-Content "deployment/gcp/frontend.yaml" -Raw
$frontendYaml = $frontendYaml -replace "PROJECT_ID", $projectId
$frontendYaml | Out-File -FilePath "$env:TEMP\frontend.yaml" -Encoding UTF8

# Deploy backend
Write-Host ""
Write-Host "Deploying backend to Cloud Run..." -ForegroundColor Yellow
gcloud run services replace "$env:TEMP\backend.yaml" --region=$region --platform=managed --allow-unauthenticated

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend deployment failed" -ForegroundColor Red
    exit 1
}

# Get backend URL
$backendUrl = gcloud run services describe racefacer-backend --region=$region --format="value(status.url)"
Write-Host "Backend deployed: $backendUrl" -ForegroundColor Green

# Deploy frontend
Write-Host ""
Write-Host "Deploying frontend to Cloud Run..." -ForegroundColor Yellow
gcloud run services replace "$env:TEMP\frontend.yaml" --region=$region --platform=managed --allow-unauthenticated

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend deployment failed" -ForegroundColor Red
    exit 1
}

# Get frontend URL
$frontendUrl = gcloud run services describe racefacer-frontend --region=$region --format="value(status.url)"
Write-Host "Frontend deployed: $frontendUrl" -ForegroundColor Green

# Cleanup
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
Write-Host "IMPORTANT: Update frontend config!" -ForegroundColor Yellow
Write-Host "  Edit: js/core/config.js"
Write-Host "  Set SERVER_URL: '$backendUrl'"
Write-Host "  Then rebuild and redeploy frontend"
Write-Host ""





