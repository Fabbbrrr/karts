# Teardown script for Google Cloud resources (PowerShell)
param(
    [string]$ProjectId = "",
    [string]$Region = "us-central1",
    [switch]$DisableApis = $false
)

$ErrorActionPreference = "Continue"

Write-Host "RaceFacer Google Cloud Teardown" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Preconditions
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'gcloud' CLI not found" -ForegroundColor Red
    exit 1
}

$activeAccount = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if ([string]::IsNullOrWhiteSpace($activeAccount)) {
    Write-Host "Error: Not logged in to Google Cloud" -ForegroundColor Red
    Write-Host "Run: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

if (-not [string]::IsNullOrWhiteSpace($ProjectId)) {
    Write-Host "Setting gcloud project to: $ProjectId" -ForegroundColor Yellow
    gcloud config set project $ProjectId | Out-Null
}

$projectId = gcloud config get-value project 2>$null
if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Host "Error: No project set" -ForegroundColor Red
    exit 1
}

Write-Host "Project: $projectId" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor Green

$projectNumber = gcloud projects describe $projectId --format="value(projectNumber)"
$schedulerSa = "scheduler-runner@$projectId.iam.gserviceaccount.com"
$bucketName = ("{0}-racefacer-storage-{1}" -f $projectId, $Region).ToLower()

# 1) Delete Cloud Scheduler jobs
Write-Host ""
Write-Host "Deleting Cloud Scheduler jobs (if exist)..." -ForegroundColor Yellow
try { gcloud scheduler jobs delete backend-scale-up --location=$Region --quiet *> $null } catch {}
try { gcloud scheduler jobs delete backend-scale-down --location=$Region --quiet *> $null } catch {}

# 2) Delete Cloud Run services
Write-Host ""
Write-Host "Deleting Cloud Run services (if exist)..." -ForegroundColor Yellow
try { gcloud run services delete racefacer-backend --region=$Region --platform=managed --quiet *> $null } catch {}
try { gcloud run services delete racefacer-frontend --region=$Region --platform=managed --quiet *> $null } catch {}

# 3) Delete container images (GCR)
Write-Host ""
Write-Host "Deleting container images (if exist)..." -ForegroundColor Yellow
foreach ($image in @("racefacer-backend","racefacer-frontend")) {
    try {
        $digests = gcloud container images list-tags "gcr.io/$projectId/$image" --format="get(digest)" 2>$null
        foreach ($d in $digests) {
            if (-not [string]::IsNullOrWhiteSpace($d)) {
                try { gcloud container images delete "gcr.io/$projectId/$image@$d" --quiet *> $null } catch {}
            }
        }
        try { gcloud container images delete "gcr.io/$projectId/$image:latest" --quiet --force-delete-tags *> $null } catch {}
    } catch {}
}

# 4) Delete GCS buckets and contents
Write-Host ""
Write-Host "Deleting GCS buckets and contents (if exist)..." -ForegroundColor Yellow
try { gcloud storage rm -r "gs://$bucketName" --quiet *> $null } catch {}
try { gcloud storage buckets delete "gs://$bucketName" --quiet *> $null } catch {}

# Cloud Build source bucket
try { gcloud storage rm -r "gs://$projectId`_cloudbuild" --quiet *> $null } catch {}

# 5) Delete Scheduler service account
Write-Host ""
Write-Host "Deleting Scheduler service account (if exist)..." -ForegroundColor Yellow
try { gcloud iam service-accounts delete "$schedulerSa" --quiet *> $null } catch {}

# 6) Optionally disable APIs to avoid accidental costs
if ($DisableApis) {
    Write-Host ""
    Write-Host "Disabling core APIs (can be re-enabled by deploy script)..." -ForegroundColor Yellow
    gcloud services disable run.googleapis.com cloudbuild.googleapis.com cloudscheduler.googleapis.com containerregistry.googleapis.com --quiet 2>$null | Out-Null
}

Write-Host ""
Write-Host "Teardown completed for project '$projectId' in region '$Region'." -ForegroundColor Green
Write-Host "You can now run the deploy script to recreate everything from scratch." -ForegroundColor Green


