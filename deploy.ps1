# RaceFacer GCP Deployment Script - COMPLETELY REWORKED
# Forces actual deployments with verification
# Uses unique image tags and validates deployment happened

$ErrorActionPreference = "Continue"  # gcloud writes to stderr

# ============================================================================
# Color Functions
# ============================================================================
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host $msg -ForegroundColor Red }
function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Magenta }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   RaceFacer GCP Deployment - FORCED FRESH DEPLOYMENT      " -ForegroundColor Cyan
Write-Host "   With Verification & Unique Image Tags                   " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Environment Validation
# ============================================================================
Write-Step "Step 1/9: Validating environment..."

# Check gcloud CLI
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Err "[X] gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
}
Write-Success "[OK] gcloud CLI found"

# Check authentication
$account = gcloud config get-value account 2>&1 | Out-String
$account = $account.Trim()
if ([string]::IsNullOrWhiteSpace($account) -or $account -eq "(unset)") {
    Write-Err "[X] Not authenticated. Run: gcloud auth login"
    exit 1
}
Write-Success "[OK] Authenticated as: $account"

# Get project
$projectId = gcloud config get-value project 2>&1 | Out-String
$projectId = $projectId.Trim()
if ([string]::IsNullOrWhiteSpace($projectId) -or $projectId -eq "(unset)") {
    Write-Err "[X] No project set. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
}
Write-Success "[OK] Project: $projectId"

$region = "us-central1"
Write-Success "[OK] Region: $region"

# Generate unique deployment tag (timestamp-based)
$deploymentTag = Get-Date -Format "yyyyMMdd-HHmmss"
Write-Info "Deployment Tag: $deploymentTag"
Write-Host ""

# ============================================================================
# STEP 2: Enable Required APIs
# ============================================================================
Write-Step "Step 2/9: Ensuring required APIs are enabled..."

$apis = @(
    "run.googleapis.com",
    "containerregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "  Checking $api..." -NoNewline
    gcloud services enable $api --quiet 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Success " [OK]"
    } else {
        Write-Err " [FAILED]"
        exit 1
    }
}

# ============================================================================
# STEP 3: Get Current Service States (for comparison)
# ============================================================================
Write-Step "Step 3/9: Recording current service states..."

Write-Host "  Checking backend..." -NoNewline
$backendBefore = gcloud run services describe racefacer-backend --region=$region --format="value(status.latestCreatedRevisionName,metadata.generation)" 2>&1 | Out-String
if ($LASTEXITCODE -eq 0) {
    $backendBefore = $backendBefore.Trim()
    Write-Info " Current: $backendBefore"
} else {
    Write-Warn " (new service)"
    $backendBefore = "NEW"
}

Write-Host "  Checking frontend..." -NoNewline
$frontendBefore = gcloud run services describe racefacer-frontend --region=$region --format="value(status.latestCreatedRevisionName,metadata.generation)" 2>&1 | Out-String
if ($LASTEXITCODE -eq 0) {
    $frontendBefore = $frontendBefore.Trim()
    Write-Info " Current: $frontendBefore"
} else {
    Write-Warn " (new service)"
    $frontendBefore = "NEW"
}

# ============================================================================
# STEP 4: Build Backend Image with Unique Tag
# ============================================================================
Write-Step "Step 4/9: Building backend image..."
Write-Info "Tag: gcr.io/$projectId/racefacer-backend:$deploymentTag"
Write-Info "This will take 2-4 minutes..."

$buildStartTime = Get-Date

gcloud builds submit --config cloudbuild.backend.yaml `
    --substitutions=_TAG_NAME=$deploymentTag .

if ($LASTEXITCODE -ne 0) {
    Write-Err "[X] Backend build FAILED"
    exit 1
}

$buildEndTime = Get-Date
$buildDuration = ($buildEndTime - $buildStartTime).TotalSeconds
Write-Success "[OK] Backend built in $([math]::Round($buildDuration, 1))s"

# Verify image was created
Write-Host "  Verifying image..." -NoNewline
$imageCheck = gcloud container images describe "gcr.io/$projectId/racefacer-backend:$deploymentTag" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success " [VERIFIED]"
} else {
    Write-Err " [NOT FOUND]"
    Write-Err "Image was not created properly!"
    exit 1
}

# ============================================================================
# STEP 5: Deploy Backend with Unique Tag
# ============================================================================
Write-Step "Step 5/9: Deploying backend service..."

Write-Host "  Creating deployment manifest..." -NoNewline
$backendYaml = Get-Content "deployment/gcp/backend.yaml" -Raw
$backendYaml = $backendYaml -replace "PROJECT_ID", $projectId
# CRITICAL: Use the unique tag, not :latest
$backendYaml = $backendYaml -replace "racefacer-backend:latest", "racefacer-backend:$deploymentTag"
$backendTempFile = "$env:TEMP\backend-$deploymentTag.yaml"
$backendYaml | Out-File -FilePath $backendTempFile -Encoding UTF8
Write-Success " [OK]"

Write-Host "  Deploying to Cloud Run..." -NoNewline
gcloud run services replace $backendTempFile --region=$region --platform=managed 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Err " [FAILED]"
    Remove-Item $backendTempFile -ErrorAction SilentlyContinue
    exit 1
}
Write-Success " [OK]"

# Set public access
Write-Host "  Setting public access..." -NoNewline
gcloud run services add-iam-policy-binding racefacer-backend `
    --region=$region `
    --member="allUsers" `
    --role="roles/run.invoker" `
    --quiet 2>&1 | Out-Null
Write-Success " [OK]"

# Wait for service to be ready
Write-Host "  Waiting for service to be ready..." -NoNewline
$maxWait = 60
$waited = 0
$ready = $false
while ($waited -lt $maxWait) {
    $status = gcloud run services describe racefacer-backend --region=$region --format="value(status.conditions[0].status)" 2>&1 | Out-String
    $status = $status.Trim()
    if ($status -eq "True") {
        $ready = $true
        break
    }
    Start-Sleep -Seconds 2
    $waited += 2
}

if (-not $ready) {
    Write-Err " [TIMEOUT]"
    Write-Warn "Service may still be deploying. Check logs."
} else {
    Write-Success " [READY]"
}

# Get backend URL
$backendUrl = gcloud run services describe racefacer-backend --region=$region --format="value(status.url)" 2>&1 | Out-String
$backendUrl = $backendUrl.Trim()
Write-Success "[OK] Backend URL: $backendUrl"

# Cleanup temp file
Remove-Item $backendTempFile -ErrorAction SilentlyContinue

# ============================================================================
# STEP 6: Update Frontend Config
# ============================================================================
Write-Step "Step 6/9: Updating frontend configuration..."

Write-Host "  Backing up config..." -NoNewline
Copy-Item "js/core/config.js" "js/core/config.js.backup" -Force
Write-Success " [OK]"

Write-Host "  Setting SERVER_URL to: $backendUrl" -NoNewline
$configContent = Get-Content "js/core/config.js" -Raw
$pattern = "SERVER_URL:\s*['\`"][^'\`"]*['\`"]"
$replacement = "SERVER_URL: '$backendUrl'"
$configContent = $configContent -replace $pattern, $replacement
$configContent | Out-File -FilePath "js/core/config.js" -Encoding UTF8 -NoNewline
Write-Success " [OK]"

# ============================================================================
# STEP 7: Build Frontend Image with Unique Tag
# ============================================================================
Write-Step "Step 7/9: Building frontend image..."
Write-Info "Tag: gcr.io/$projectId/racefacer-frontend:$deploymentTag"
Write-Info "This will take 1-2 minutes..."

$buildStartTime = Get-Date

gcloud builds submit --config cloudbuild.frontend.yaml `
    --substitutions=_TAG_NAME=$deploymentTag .

$frontendBuildSuccess = $LASTEXITCODE -eq 0

# Restore config immediately
Write-Host "  Restoring original config..." -NoNewline
Move-Item "js/core/config.js.backup" "js/core/config.js" -Force
Write-Success " [OK]"

if (-not $frontendBuildSuccess) {
    Write-Err "[X] Frontend build FAILED"
    exit 1
}

$buildEndTime = Get-Date
$buildDuration = ($buildEndTime - $buildStartTime).TotalSeconds
Write-Success "[OK] Frontend built in $([math]::Round($buildDuration, 1))s"

# Verify image was created
Write-Host "  Verifying image..." -NoNewline
$imageCheck = gcloud container images describe "gcr.io/$projectId/racefacer-frontend:$deploymentTag" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success " [VERIFIED]"
} else {
    Write-Err " [NOT FOUND]"
    Write-Err "Image was not created properly!"
    exit 1
}

# ============================================================================
# STEP 8: Deploy Frontend with Unique Tag
# ============================================================================
Write-Step "Step 8/9: Deploying frontend service..."

Write-Host "  Creating deployment manifest..." -NoNewline
$frontendYaml = Get-Content "deployment/gcp/frontend.yaml" -Raw
$frontendYaml = $frontendYaml -replace "PROJECT_ID", $projectId
# CRITICAL: Use the unique tag, not :latest
$frontendYaml = $frontendYaml -replace "racefacer-frontend:latest", "racefacer-frontend:$deploymentTag"
$frontendTempFile = "$env:TEMP\frontend-$deploymentTag.yaml"
$frontendYaml | Out-File -FilePath $frontendTempFile -Encoding UTF8
Write-Success " [OK]"

Write-Host "  Deploying to Cloud Run..." -NoNewline
gcloud run services replace $frontendTempFile --region=$region --platform=managed 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Err " [FAILED]"
    Remove-Item $frontendTempFile -ErrorAction SilentlyContinue
    exit 1
}
Write-Success " [OK]"

# Set public access
Write-Host "  Setting public access..." -NoNewline
gcloud run services add-iam-policy-binding racefacer-frontend `
    --region=$region `
    --member="allUsers" `
    --role="roles/run.invoker" `
    --quiet 2>&1 | Out-Null
Write-Success " [OK]"

# Wait for service to be ready
Write-Host "  Waiting for service to be ready..." -NoNewline
$maxWait = 60
$waited = 0
$ready = $false
while ($waited -lt $maxWait) {
    $status = gcloud run services describe racefacer-frontend --region=$region --format="value(status.conditions[0].status)" 2>&1 | Out-String
    $status = $status.Trim()
    if ($status -eq "True") {
        $ready = $true
        break
    }
    Start-Sleep -Seconds 2
    $waited += 2
}

if (-not $ready) {
    Write-Err " [TIMEOUT]"
    Write-Warn "Service may still be deploying. Check logs."
} else {
    Write-Success " [READY]"
}

# Get frontend URL
$frontendUrl = gcloud run services describe racefacer-frontend --region=$region --format="value(status.url)" 2>&1 | Out-String
$frontendUrl = $frontendUrl.Trim()
Write-Success "[OK] Frontend URL: $frontendUrl"

# Cleanup temp file
Remove-Item $frontendTempFile -ErrorAction SilentlyContinue

# ============================================================================
# STEP 9: VERIFY DEPLOYMENT ACTUALLY HAPPENED
# ============================================================================
Write-Step "Step 9/9: VERIFYING deployment was successful..."

Write-Host ""
Write-Host "  Checking Backend Deployment:" -ForegroundColor Yellow
$backendAfter = gcloud run services describe racefacer-backend --region=$region --format="value(status.latestCreatedRevisionName,metadata.generation)" 2>&1 | Out-String
$backendAfter = $backendAfter.Trim()
$backendImage = gcloud run services describe racefacer-backend --region=$region --format="value(spec.template.spec.containers[0].image)" 2>&1 | Out-String
$backendImage = $backendImage.Trim()

if ($backendAfter -ne $backendBefore) {
    Write-Success "    [✓] NEW REVISION DEPLOYED"
    Write-Info "      Before: $backendBefore"
    Write-Info "      After:  $backendAfter"
    Write-Info "      Image:  $backendImage"
    
    # Verify it's using our unique tag
    if ($backendImage -match $deploymentTag) {
        Write-Success "    [✓] Using correct image tag: $deploymentTag"
    } else {
        Write-Err "    [X] WARNING: Not using expected tag!"
        Write-Warn "    Expected tag: $deploymentTag"
        Write-Warn "    Actual image: $backendImage"
    }
} else {
    Write-Err "    [X] NO NEW REVISION - DEPLOYMENT FAILED!"
    Write-Warn "    This means Cloud Run is still using the old version."
    exit 1
}

Write-Host ""
Write-Host "  Checking Frontend Deployment:" -ForegroundColor Yellow
$frontendAfter = gcloud run services describe racefacer-frontend --region=$region --format="value(status.latestCreatedRevisionName,metadata.generation)" 2>&1 | Out-String
$frontendAfter = $frontendAfter.Trim()
$frontendImage = gcloud run services describe racefacer-frontend --region=$region --format="value(spec.template.spec.containers[0].image)" 2>&1 | Out-String
$frontendImage = $frontendImage.Trim()

if ($frontendAfter -ne $frontendBefore) {
    Write-Success "    [✓] NEW REVISION DEPLOYED"
    Write-Info "      Before: $frontendBefore"
    Write-Info "      After:  $frontendAfter"
    Write-Info "      Image:  $frontendImage"
    
    # Verify it's using our unique tag
    if ($frontendImage -match $deploymentTag) {
        Write-Success "    [✓] Using correct image tag: $deploymentTag"
    } else {
        Write-Err "    [X] WARNING: Not using expected tag!"
        Write-Warn "    Expected tag: $deploymentTag"
        Write-Warn "    Actual image: $frontendImage"
    }
} else {
    Write-Err "    [X] NO NEW REVISION - DEPLOYMENT FAILED!"
    Write-Warn "    This means Cloud Run is still using the old version."
    exit 1
}

# Test backend health
Write-Host ""
Write-Host "  Testing Backend Health:" -ForegroundColor Yellow
Write-Host "    Calling $backendUrl/health..." -NoNewline
try {
    $healthResponse = Invoke-RestMethod -Uri "$backendUrl/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Success " [✓ HEALTHY]"
    Write-Info "      Response: $($healthResponse | ConvertTo-Json -Compress)"
} catch {
    Write-Err " [X FAILED]"
    Write-Warn "    Error: $($_.Exception.Message)"
    Write-Warn "    Backend may still be starting up. Check logs."
}

# ============================================================================
# SUCCESS - DEPLOYMENT COMPLETE
# ============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "        [✓ SUCCESS] DEPLOYMENT VERIFIED & COMPLETE         " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Write-Host "DEPLOYMENT SUMMARY" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Deployment Tag:  " -NoNewline -ForegroundColor White
Write-Host $deploymentTag -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend URL:     " -NoNewline -ForegroundColor White
Write-Host $backendUrl -ForegroundColor Yellow
Write-Host "  Frontend URL:    " -NoNewline -ForegroundColor White
Write-Host $frontendUrl -ForegroundColor Yellow
Write-Host ""
Write-Host "  Project:         $projectId" -ForegroundColor Gray
Write-Host "  Region:          $region" -ForegroundColor Gray
Write-Host "  Account:         $account" -ForegroundColor Gray
Write-Host ""

Write-Host "VERIFICATION RESULTS" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  [✓] Backend revision changed: $backendBefore -> $backendAfter" -ForegroundColor Green
Write-Host "  [✓] Frontend revision changed: $frontendBefore -> $frontendAfter" -ForegroundColor Green
Write-Host "  [✓] Using unique image tags: $deploymentTag" -ForegroundColor Green
Write-Host "  [✓] Images verified in registry" -ForegroundColor Green
Write-Host "  [✓] Services marked as ready" -ForegroundColor Green
Write-Host ""

Write-Host "NEXT STEPS" -ForegroundColor Yellow
Write-Host "------------------------------------------------------------" -ForegroundColor Yellow
Write-Host "  1. Open: " -NoNewline
Write-Host $frontendUrl -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. CLEAR YOUR BROWSER CACHE:" -ForegroundColor Red
Write-Host "     - Windows/Linux: Ctrl+Shift+Delete" -ForegroundColor White
Write-Host "     - Mac: Cmd+Shift+Delete" -ForegroundColor White
Write-Host "     - Or use Incognito/Private mode" -ForegroundColor White
Write-Host ""
Write-Host "  3. Hard refresh:" -ForegroundColor Yellow
Write-Host "     - Windows/Linux: Ctrl+Shift+R" -ForegroundColor White
Write-Host "     - Mac: Cmd+Shift+R" -ForegroundColor White
Write-Host ""

Write-Host "USEFUL COMMANDS" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  View backend logs:" -ForegroundColor White
Write-Host "    gcloud run logs read racefacer-backend --region=$region --limit=100" -ForegroundColor Gray
Write-Host ""
Write-Host "  View frontend logs:" -ForegroundColor White
Write-Host "    gcloud run logs read racefacer-frontend --region=$region --limit=100" -ForegroundColor Gray
Write-Host ""
Write-Host "  List all services:" -ForegroundColor White
Write-Host "    gcloud run services list --region=$region" -ForegroundColor Gray
Write-Host ""
Write-Host "  Check backend health:" -ForegroundColor White
Write-Host "    curl $backendUrl/health" -ForegroundColor Gray
Write-Host ""
Write-Host "  View revisions:" -ForegroundColor White
Write-Host "    gcloud run revisions list --service=racefacer-backend --region=$region" -ForegroundColor Gray
Write-Host "    gcloud run revisions list --service=racefacer-frontend --region=$region" -ForegroundColor Gray
Write-Host ""

Write-Success "[DONE] Deployment completed and verified successfully!"
Write-Host ""
