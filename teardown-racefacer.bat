@echo off
setlocal enabledelayedexpansion

REM Quick launcher to teardown RaceFacer GCP stack from Windows
REM Uses project: racefacer-app, region: us-central1

set "PROJECT_ID=racefacer-app"
set "REGION=us-central1"
set "SCRIPT_DIR=%~dp0"

echo Teardown for project: %PROJECT_ID%
echo Region: %REGION%

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%teardown-gcp.ps1" -ProjectId %PROJECT_ID% -Region %REGION%

REM --- Post-teardown status ---
echo.
echo ===== Teardown Status =====
powershell -NoProfile -ExecutionPolicy Bypass -Command "try{ gcloud config set project %PROJECT_ID% | Out-Null; $region='%REGION%'; Write-Host 'Cloud Run services remaining:'; gcloud run services list --region=$region --format='table(metadata.name,status.url)' 2>$null; Write-Host ''; Write-Host 'Scheduler jobs remaining:'; gcloud scheduler jobs list --location=$region --format='table(name,schedule)' 2>$null; Write-Host ''; Write-Host 'Storage buckets (filtered):'; gcloud storage buckets list --filter='name:%PROJECT_ID%-racefacer-storage-%REGION%' --format='value(name)' 2>$null; } catch { Write-Host 'Note: Could not fetch teardown status (APIs may be disabled).' }"

echo.
echo Done. Press any key to close...
pause >nul


