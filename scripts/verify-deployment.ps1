# Deployment Verification Script
# Checks current state of GCP Cloud Run services

$ErrorActionPreference = "Continue"

function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host $msg -ForegroundColor Red }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   RaceFacer Deployment Verification                       " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Err "[X] gcloud CLI not found"
    exit 1
}

# Get project and region
$projectId = gcloud config get-value project 2>&1 | Out-String
$projectId = $projectId.Trim()
$region = "us-central1"

if ([string]::IsNullOrWhiteSpace($projectId) -or $projectId -eq "(unset)") {
    Write-Err "[X] No project configured"
    exit 1
}

Write-Info "Project: $projectId"
Write-Info "Region: $region"
Write-Host ""

# ============================================================================
# Check Backend Service
# ============================================================================
Write-Host "Backend Service" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor Gray

$backendExists = $true
$backendData = gcloud run services describe racefacer-backend --region=$region --format="json" 2>&1 | ConvertFrom-Json -ErrorAction SilentlyContinue

if ($null -eq $backendData) {
    Write-Err "  [X] Service does not exist"
    $backendExists = $false
} else {
    $backendUrl = $backendData.status.url
    $backendRevision = $backendData.status.latestCreatedRevisionName
    $backendImage = $backendData.spec.template.spec.containers[0].image
    $backendReady = $backendData.status.conditions[0].status
    
    Write-Success "  [✓] Service exists"
    Write-Info "  Name:      racefacer-backend"
    Write-Info "  URL:       $backendUrl"
    Write-Info "  Revision:  $backendRevision"
    Write-Info "  Image:     $backendImage"
    
    if ($backendReady -eq "True") {
        Write-Success "  Status:    READY"
    } else {
        Write-Warn "  Status:    NOT READY"
    }
    
    # Get revision timestamp
    Write-Host ""
    Write-Host "  Recent Revisions:" -ForegroundColor Cyan
    $revisions = gcloud run revisions list --service=racefacer-backend --region=$region --limit=3 --format="table(metadata.name,status.conditions[0].lastTransitionTime:sort=1:reverse)" 2>&1 | Out-String
    Write-Host $revisions -ForegroundColor Gray
    
    # Test health endpoint
    Write-Host "  Testing Health Endpoint:" -ForegroundColor Cyan
    Write-Host "  Calling $backendUrl/health..." -NoNewline
    try {
        $healthResponse = Invoke-RestMethod -Uri "$backendUrl/health" -TimeoutSec 10 -ErrorAction Stop
        Write-Success " [✓ HEALTHY]"
        Write-Info "  Response: $($healthResponse | ConvertTo-Json -Compress)"
    } catch {
        Write-Err " [X FAILED]"
        Write-Warn "  Error: $($_.Exception.Message)"
    }
}

Write-Host ""

# ============================================================================
# Check Frontend Service
# ============================================================================
Write-Host "Frontend Service" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor Gray

$frontendExists = $true
$frontendData = gcloud run services describe racefacer-frontend --region=$region --format="json" 2>&1 | ConvertFrom-Json -ErrorAction SilentlyContinue

if ($null -eq $frontendData) {
    Write-Err "  [X] Service does not exist"
    $frontendExists = $false
} else {
    $frontendUrl = $frontendData.status.url
    $frontendRevision = $frontendData.status.latestCreatedRevisionName
    $frontendImage = $frontendData.spec.template.spec.containers[0].image
    $frontendReady = $frontendData.status.conditions[0].status
    
    Write-Success "  [✓] Service exists"
    Write-Info "  Name:      racefacer-frontend"
    Write-Info "  URL:       $frontendUrl"
    Write-Info "  Revision:  $frontendRevision"
    Write-Info "  Image:     $frontendImage"
    
    if ($frontendReady -eq "True") {
        Write-Success "  Status:    READY"
    } else {
        Write-Warn "  Status:    NOT READY"
    }
    
    # Get revision timestamp
    Write-Host ""
    Write-Host "  Recent Revisions:" -ForegroundColor Cyan
    $revisions = gcloud run revisions list --service=racefacer-frontend --region=$region --limit=3 --format="table(metadata.name,status.conditions[0].lastTransitionTime:sort=1:reverse)" 2>&1 | Out-String
    Write-Host $revisions -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# Summary
# ============================================================================
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Summary                                                 " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($backendExists -and $frontendExists) {
    Write-Success "Both services are deployed"
    Write-Host ""
    Write-Host "Access your application:" -ForegroundColor Cyan
    Write-Host "  $frontendUrl" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Cyan
    Write-Host "  View logs:  gcloud run logs tail racefacer-backend --region=$region" -ForegroundColor Gray
    Write-Host "  Redeploy:   .\deploy.ps1" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Warn "Services need to be deployed"
    Write-Host ""
    Write-Host "Run deployment:" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1" -ForegroundColor Yellow
    Write-Host ""
}



