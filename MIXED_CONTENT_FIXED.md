# 🔒 Mixed Content Error - FIXED

## Problem

When accessing the GCP deployed frontend:
```
Blocked loading mixed active content "http://172.26.51.66:3001/api/current"
```

**Cause**: Frontend served over HTTPS trying to connect to HTTP backend (WSL IP).

## Root Cause

The `js/core/config.js` was hardcoded with:
```javascript
SERVER_URL: 'http://172.26.51.66:3001'  // ❌ HTTP in production!
```

Browsers block HTTP requests from HTTPS pages (Mixed Content Security Policy).

## Solution

### Auto-Detect Environment

Updated `js/core/config.js` to automatically detect environment:

```javascript
// Detect if running in production
const isProduction = window.location.hostname.includes('run.app') || 
                     window.location.hostname.includes('cloudrun') ||
                     window.location.protocol === 'https:';

function getBackendUrl() {
    // Production: Use HTTPS backend
    if (isProduction) {
        return 'https://racefacer-backend-nynn4wphja-uc.a.run.app';
    }
    
    // Development: Use HTTP (WSL or localhost)
    const wslIp = window.localStorage.getItem('wsl_backend_ip');
    if (wslIp) {
        return `http://${wslIp}:3001`;
    }
    
    return 'http://localhost:3001';
}

export const CONFIG = {
    ...
    SERVER_URL: getBackendUrl(),  // ✅ Auto-detects!
    IS_PRODUCTION: isProduction
};
```

### Debug Logging

Added console log on app load:
```javascript
console.log('🔧 RaceFacer Config:', {
    environment: CONFIG.IS_PRODUCTION ? 'PRODUCTION' : 'DEVELOPMENT',
    backendUrl: CONFIG.SERVER_URL,
    backendMode: CONFIG.BACKEND_MODE
});
```

## How to Deploy Fix

### Option 1: Automated Script

```bash
bash deploy-frontend-fix.sh
```

### Option 2: Manual Deployment

```bash
# 1. Build frontend image
docker build -f Dockerfile.frontend -t gcr.io/racefacer-project/racefacer-frontend:latest .

# 2. Push to GCR
docker push gcr.io/racefacer-project/racefacer-frontend:latest

# 3. Deploy to Cloud Run
gcloud run deploy racefacer-frontend \
  --image gcr.io/racefacer-project/racefacer-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 3: Use Existing Deploy Script

If you already have `deploy-gcp.sh` or `deploy-gcp.ps1`:
```bash
# Just redeploy frontend section
bash deploy-gcp.sh
```

## Verification

### 1. Check Console After Deploy

Open browser console on deployed site:
```
🔧 RaceFacer Config: {
  environment: "PRODUCTION",
  backendUrl: "https://racefacer-backend-nynn4wphja-uc.a.run.app",
  backendMode: true
}
```

Should show:
- ✅ `PRODUCTION` environment
- ✅ `https://` backend URL (not `http://`)

### 2. Network Tab

Check that API calls go to HTTPS:
```
✅ https://racefacer-backend-nynn4wphja-uc.a.run.app/api/current
❌ http://172.26.51.66:3001/api/current  (should NOT appear)
```

### 3. No Mixed Content Errors

Console should be clean:
```
✅ No "Blocked loading mixed active content" errors
✅ API calls succeed
✅ SSE/polling works
```

## Development vs Production

### Development (localhost or WSL):
```javascript
// Uses HTTP - no HTTPS required locally
SERVER_URL: 'http://172.26.51.66:3001'
or
SERVER_URL: 'http://localhost:3001'
```

### Production (GCP Cloud Run):
```javascript
// Automatically uses HTTPS
SERVER_URL: 'https://racefacer-backend-nynn4wphja-uc.a.run.app'
```

## How It Works

```
┌─────────────────────────────────────────┐
│ Browser opens app                       │
├─────────────────────────────────────────┤
│ Check: window.location.hostname         │
├─────────────────────────────────────────┤
│ Contains "run.app"?                     │
│   YES → Production                      │
│       → Use HTTPS backend               │
│   NO  → Development                     │
│       → Use HTTP localhost/WSL          │
└─────────────────────────────────────────┘
```

## Files Modified

- ✅ `js/core/config.js` - Auto-detect environment, use correct protocol
- ✅ `deploy-frontend-fix.sh` - Quick redeploy script
- ✅ `MIXED_CONTENT_FIXED.md` - This documentation

## Common Issues

### Still Getting Mixed Content?

**Clear browser cache**:
```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

### Backend Not Deployed?

Make sure backend is also deployed:
```bash
gcloud run services list --platform managed --region us-central1

# Should show both:
# racefacer-frontend  (HTTPS URL)
# racefacer-backend   (HTTPS URL)
```

### Wrong Backend URL in Logs?

Check what the app detected:
```javascript
// In browser console:
console.log(window.location.hostname);  // Should be "...run.app"
console.log(window.location.protocol);  // Should be "https:"
```

---

**Status**: ✅ FIXED  
**Action**: Redeploy frontend to GCP  
**Result**: Auto-detects production, uses HTTPS backend


