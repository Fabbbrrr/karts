@echo off
setlocal enabledelayedexpansion

REM Quick launcher to deploy RaceFacer to GCP from Windows
REM Uses project: racefacer-app, region: us-central1

set "PROJECT_ID=racefacer-app"
set "REGION=us-central1"
set "SCRIPT_DIR=%~dp0"

echo Deploying to project: %PROJECT_ID%
echo Region: %REGION%

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%deploy-gcp.ps1" -ProjectId %PROJECT_ID%

REM --- Final summary with URLs and schedules ---
echo.
echo ===== Deployment Summary =====
powershell -NoProfile -ExecutionPolicy Bypass -Command "try{ gcloud config set project %PROJECT_ID% | Out-Null; $region='%REGION%'; $be=(gcloud run services describe racefacer-backend --region=$region --format='value(status.url)'); $fe=(gcloud run services describe racefacer-frontend --region=$region --format='value(status.url)'); Write-Host 'Backend URL:  ' $be; Write-Host 'Frontend URL: ' $fe; Write-Host ''; Write-Host 'Scheduler jobs:'; gcloud scheduler jobs list --location=$region --filter='name:backend-scale' --format='table(name,schedule,timeZone)'; } catch { Write-Host 'Note: Could not fetch summary details.' }"

echo.
echo Done. Press any key to close...
pause >nul


