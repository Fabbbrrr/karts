# 🚀 One-Command Deployment

Deploy your entire RaceFacer application to Google Cloud Run with a single command. No cache, always fresh code!

## Quick Start

### Windows (PowerShell)
```powershell
.\deploy.ps1
```

### Linux / Mac / WSL (Bash)
```bash
./deploy.sh
```

That's it! The script handles everything automatically.

---

## What It Does

The automated deployment script:

1. ✅ **Validates** your environment (gcloud CLI, login, project)
2. ✅ **Enables** required Google Cloud APIs
3. ✅ **Cleans up** old Docker images (prevents cache)
4. ✅ **Builds** backend Docker image (NO CACHE, 2-4 min)
5. ✅ **Deploys** backend to Cloud Run
6. ✅ **Updates** frontend config with backend URL
7. ✅ **Builds** frontend Docker image (NO CACHE, 1-2 min)
8. ✅ **Deploys** frontend to Cloud Run
9. ✅ **Shows** deployment summary with URLs

**Total time:** ~5-7 minutes

---

## Prerequisites

### 1. Install gcloud CLI
```bash
# Check if installed
gcloud version

# If not installed:
# Windows: https://cloud.google.com/sdk/docs/install#windows
# Mac: brew install google-cloud-sdk
# Linux: https://cloud.google.com/sdk/docs/install#linux
```

### 2. Login to Google Cloud
```bash
gcloud auth login
```

### 3. Set Your Project
```bash
# List your projects
gcloud projects list

# Set active project
gcloud config set project YOUR_PROJECT_ID
```

---

## First Time Setup

If this is your first deployment, you may need to:

1. **Create a Google Cloud Project** (if you don't have one)
   - Go to: https://console.cloud.google.com/
   - Create a new project
   - Note the Project ID

2. **Enable Billing** (required for Cloud Run)
   - Free tier includes: 2 million requests/month
   - 360,000 GB-seconds of memory
   - 180,000 vCPU-seconds of compute time

3. **Set Default Region** (optional)
   ```bash
   gcloud config set run/region us-central1
   ```

---

## After Deployment

### View Your App
The script will output URLs like:
```
Backend URL:  https://racefacer-backend-xxxxx-uc.a.run.app
Frontend URL: https://racefacer-frontend-xxxxx-uc.a.run.app
```

Open the **Frontend URL** in your browser.

### Clear Browser Cache
Press **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac) to hard refresh and clear cache.

### View Logs
```bash
# Backend logs
gcloud run logs read racefacer-backend --region=us-central1 --limit=50

# Frontend logs
gcloud run logs read racefacer-frontend --region=us-central1 --limit=50

# Live tail (watch in real-time)
gcloud run logs tail racefacer-backend --region=us-central1
```

### Test Endpoints
```bash
# Check backend health
curl https://YOUR-BACKEND-URL/health

# Check frontend config
curl https://YOUR-FRONTEND-URL/js/core/config.js

# Check current session
curl https://YOUR-BACKEND-URL/api/current
```

---

## Troubleshooting

### "gcloud: command not found"
Install the gcloud CLI: https://cloud.google.com/sdk/docs/install

### "Not logged in to Google Cloud"
Run: `gcloud auth login`

### "No project set"
Run: `gcloud config set project YOUR_PROJECT_ID`

### "Permission denied" on deploy.sh
Run: `chmod +x deploy.sh`

### Build fails with quota error
You've exceeded the free tier Cloud Build minutes (120 min/day). Wait for daily reset or upgrade to paid tier.

### Old code still showing
1. Hard refresh browser: Ctrl+Shift+R
2. Clear browser cache completely
3. Open in incognito/private window
4. Check the build timestamp in HTML source

### Backend returns 404
The backend might still be starting up. Wait 30-60 seconds and refresh.

---

## Cost Estimate

### Free Tier (Monthly)
- **Cloud Run**: 2 million requests, 360K GB-sec memory, 180K vCPU-sec compute
- **Cloud Build**: 120 build-minutes per day
- **Container Registry**: 0.5 GB storage

### Typical Usage
With this deployment setup:
- ~2 builds per day = 12 min/day = ~360 min/month = **FREE** (within 3,600 min/month)
- Small app with light traffic = **FREE** (well within Cloud Run limits)

**Expected monthly cost: $0** (if you stay within free tier)

---

## Advanced Usage

### Deploy Backend Only
If you only changed backend code:
```bash
# Not available as separate script yet
# Use full deployment for now
```

### Deploy Frontend Only
If you only changed frontend code:
```powershell
# Windows
.\deploy-frontend-only.ps1

# Linux/Mac/WSL
# Use full deployment for now (frontend-only bash script not created)
```

### Force Rebuild
Already done automatically! Every deployment uses NO CACHE.

### Change Region
Edit the script and change:
```bash
REGION="us-central1"
# to
REGION="your-preferred-region"
```

Supported regions: https://cloud.google.com/run/docs/locations

---

## Cache Busting Features

Every deployment ensures **zero cache**:

- ✅ Deletes old Docker images before building
- ✅ `--no-cache` flag on Docker builds
- ✅ `--no-source-cache` flag on Cloud Build
- ✅ `--pull` flag to download fresh base images
- ✅ Unique `BUILD_ID` per deployment
- ✅ npm packages reinstalled fresh (backend)
- ✅ Frontend config auto-updated with backend URL
- ✅ Build timestamp added to HTML

**Guarantee:** Every deployment uses 100% fresh code.

---

## Files

| File | Purpose |
|------|---------|
| `deploy.ps1` | **Windows PowerShell** automated deployment |
| `deploy.sh` | **Linux/Mac/WSL Bash** automated deployment |
| `deploy-frontend-only.ps1` | Quick frontend-only deployment (Windows) |
| `deploy-gcp.sh` | Manual step-by-step deployment (deprecated, use deploy.sh) |
| `cloudbuild.backend.yaml` | Backend Docker build config |
| `cloudbuild.frontend.yaml` | Frontend Docker build config |
| `Dockerfile.backend` | Backend Docker image definition |
| `Dockerfile.frontend` | Frontend Docker image definition |

---

## Support

### Documentation
- Full technical docs: `DEPLOYMENT_NO_CACHE_COMPLETE.md`
- GCP Cloud Run: https://cloud.google.com/run/docs
- gcloud CLI: https://cloud.google.com/sdk/gcloud/reference

### Common Issues
See `DEPLOYMENT_NO_CACHE_COMPLETE.md` for detailed troubleshooting.

---

## Summary

**Simple deployment:**
1. Install gcloud CLI
2. Login: `gcloud auth login`
3. Set project: `gcloud config set project YOUR_PROJECT_ID`
4. Run: `.\deploy.ps1` (Windows) or `./deploy.sh` (Linux/Mac)
5. Wait 5-7 minutes
6. Open frontend URL in browser
7. Hard refresh: Ctrl+Shift+R

**Done!** 🎉




