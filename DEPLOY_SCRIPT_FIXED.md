# 🔧 Deploy Script Fixed

## Problem
The deployment script was:
1. Building frontend image
2. **THEN** updating config.js
3. Deploying the old image (without config changes)

Result: Old `SERVER_URL: 'http://172.26.51.66:3001'` still in deployed frontend.

## Solution

Updated `deploy-gcp.ps1` to:
1. ✅ Build & deploy backend FIRST
2. ✅ Get backend URL
3. ✅ Update config.js with backend URL
4. ✅ Build frontend image (now includes updated config)
5. ✅ Deploy frontend
6. ✅ Restore original config.js

## New Deploy Flow

```
1. Build Backend → Deploy Backend
         ↓
2. Get Backend URL (https://racefacer-backend-xxx.run.app)
         ↓
3. Update js/core/config.js with backend URL
         ↓
4. Build Frontend (includes updated config!)
         ↓
5. Deploy Frontend
         ↓
6. Restore original config.js (for local development)
```

## How to Deploy Now

```powershell
.\deploy-gcp.ps1
```

The script will automatically:
- Build backend and get its URL
- Update frontend config with correct HTTPS URL
- Build frontend with updated config
- Deploy both services
- Restore your local config

## After Deployment

**Clear browser cache**:
- Windows/Linux: `Ctrl+Shift+R`
- Mac: `Cmd+Shift+R`

**Verify**:
```powershell
# Check what's actually deployed
Invoke-WebRequest -Uri "https://racefacer-frontend-nynn4wphja-uc.a.run.app/js/core/config.js" | Select-Object -ExpandProperty Content | Select-String "SERVER_URL"
```

Should show:
```javascript
SERVER_URL: 'https://racefacer-backend-nynn4wphja-uc.a.run.app'  // ✅ HTTPS!
```

## What Changed in deploy-gcp.ps1

### Before (❌ Broken):
```powershell
# Build backend
gcloud builds submit backend

# Build frontend  ← Built with OLD config
gcloud builds submit frontend

# Deploy backend
gcloud run deploy backend

# Update config.js  ← TOO LATE! Image already built
$config = $config -replace "SERVER_URL: '[^']*'", "SERVER_URL: '$backendUrl'"

# Deploy frontend  ← Deploys OLD image
gcloud run deploy frontend
```

### After (✅ Fixed):
```powershell
# Build & deploy backend FIRST
gcloud builds submit backend
gcloud run deploy backend

# Get backend URL
$backendUrl = gcloud run services describe...

# Update config BEFORE building frontend
Copy-Item config.js config.js.backup
$config -replace "return 'https://racefacer-backend-[^']*'", "return '$backendUrl'"

# Build frontend NOW (includes updated config)
gcloud builds submit frontend

# Restore original config
Move-Item config.js.backup config.js

# Deploy frontend (with correct config baked in)
gcloud run deploy frontend
```

## Files Modified

- ✅ `deploy-gcp.ps1` - Fixed deployment order
- ✅ `DEPLOY_SCRIPT_FIXED.md` - This documentation

---

**Status**: ✅ FIXED  
**Action**: Run `.\deploy-gcp.ps1`  
**Result**: Frontend will have correct HTTPS backend URL


