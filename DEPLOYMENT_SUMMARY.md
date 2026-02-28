# 🚀 RaceFacer Google Cloud Deployment - Complete

## ✅ What's Been Created

### Docker Images (Cloud Run Compatible)
1. **`Dockerfile.backend`** - Node.js backend for Cloud Run
   - Port 8080 (Cloud Run standard)
   - Non-root user
   - Health checks
   - ~512 MB RAM (free tier friendly)

2. **`Dockerfile.frontend`** - Nginx static server
   - Port 8080 (Cloud Run standard)
   - PWA optimized
   - ~256 MB RAM

### Google Cloud Manifests (`deployment/gcp/`)
1. **`backend.yaml`** - Cloud Run service for backend
   - 1 instance (persistent WebSocket)
   - CPU always allocated (WebSocket requirement)
   - 512 MB RAM, 1 vCPU
   - HTTPS automatic

2. **`frontend.yaml`** - Cloud Run service for frontend
   - Auto-scales 0-5 instances
   - Scales to zero (free!)
   - 256 MB RAM, 1 vCPU
   - HTTPS automatic

3. **`nginx.conf`** - Nginx configuration
   - Port 8080 (Cloud Run)
   - PWA support
   - Caching headers
   - Health endpoint

### Deployment Scripts
1. **`deploy-gcp.sh`** - One-command deployment
   - Enables APIs
   - Builds images
   - Deploys to Cloud Run
   - Provides URLs

### Documentation
1. **`deployment/DEPLOYMENT_GUIDE.md`** - Complete GCP guide
   - Step-by-step setup
   - Configuration
   - Monitoring
   - Troubleshooting
   - Cost optimization

2. **`DEPLOYMENT_SUMMARY.md`** - This file

## 🎯 Google Cloud Platform Features

### Cloud Run Advantages
✅ **Serverless** - No infrastructure management
✅ **Auto-scaling** - 0-N instances automatically
✅ **Pay-per-use** - Only pay for actual requests
✅ **Always Free Tier** - 2M requests/month free
✅ **HTTPS Built-in** - Automatic TLS certificates
✅ **Global CDN** - Fast worldwide
✅ **Simple Deploy** - One command deployment

### Free Tier Benefits
- **Cloud Run**: 2M requests/month, 360,000 GB-seconds
- **Cloud Build**: 120 build-minutes/day
- **Container Registry**: 0.5 GB storage
- **Cloud Storage**: 5 GB storage (optional)
- **Total Cost**: $0-10/month ✅

## 🚀 Quick Start (3 Steps)

```bash
# 1. Install Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# 2. Login and setup
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 3. Deploy!
./deploy-gcp.sh
```

**Done!** Your app is live with HTTPS ✨

## 📊 What You Get

### After Deployment

**Backend**: `https://racefacer-backend-xxxxx-uc.a.run.app`
- ✅ Connects to RaceFacer live timing
- ✅ Stores last 10 sessions
- ✅ Broadcasts to all UIs
- ✅ REST API + SSE streaming
- ✅ Always running (1 instance)

**Frontend**: `https://racefacer-frontend-xxxxx-uc.a.run.app`
- ✅ Progressive Web App
- ✅ Connects to backend
- ✅ Multi-device support
- ✅ Session replay
- ✅ Scales to zero when idle

## ⚙️ Configuration

### 1. Update RaceFacer Channel

Edit `deployment/gcp/backend.yaml`:
```yaml
- name: WS_CHANNEL
  value: "lemansentertainment"  # Your channel
```

### 2. Update Frontend Backend URL

After deploying backend, get its URL:
```bash
BACKEND_URL=$(gcloud run services describe racefacer-backend \
    --region=us-central1 --format='value(status.url)')
```

Edit `js/core/config.js`:
```javascript
export const CONFIG = {
    BACKEND_MODE: true,
    SERVER_URL: 'https://racefacer-backend-xxxxx-uc.a.run.app'
};
```

Rebuild and redeploy:
```bash
./deploy-gcp.sh
```

## 💰 Cost Breakdown

### Free Tier (Always Free)
- **Cloud Run**: 2M requests/month
- **First 180,000 vCPU-seconds/month**: FREE
- **First 360,000 GB-seconds/month**: FREE

### Our Usage (Light Traffic)
- **Backend**: ~$0-5/month
  - 1 instance always running
  - Minimal CPU (WebSocket idle)
  - Under free tier limits
  
- **Frontend**: ~$0
  - Scales to zero
  - Minimal requests
  - Completely free
  
- **Storage**: ~$0
  - Under 5GB limit
  - Free tier eligible

**Total: $0-5/month** ✅

### Comparison
| Platform | Monthly Cost | Free Tier |
|----------|--------------|-----------|
| **GCP Cloud Run** | **$0-5** | ✅ 2M requests |
| AWS EKS | $75-150 | ❌ None |
| AWS EC2 | $10-20 | ⚠️ 12 months |
| Heroku | $7-25 | ⚠️ Limited |

**GCP Cloud Run = Best value!** 🏆

## 📈 Resource Usage

### Backend Service
```yaml
resources:
  limits:
    cpu: "1000m"      # 1 vCPU
    memory: "512Mi"   # 512 MB RAM

minScale: 1           # Always running (WebSocket)
maxScale: 1           # Single instance
```

**Why 1 instance?** Backend maintains persistent WebSocket connection to RaceFacer. Multiple instances would create multiple connections.

### Frontend Service
```yaml
resources:
  limits:
    cpu: "1000m"      # 1 vCPU
    memory: "256Mi"   # 256 MB RAM

minScale: 0           # Scales to zero
maxScale: 5           # Up to 5 instances
```

**Scales to zero!** No cost when nobody's using it.

## 🔧 Common Commands

### Deploy
```bash
./deploy-gcp.sh
```

### View Logs
```bash
# Backend (live)
gcloud run logs tail racefacer-backend --region=us-central1

# Last 50 entries
gcloud run logs read racefacer-backend --region=us-central1 --limit=50
```

### Update Config
```bash
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --set-env-vars="WS_CHANNEL=your-channel"
```

### Check Status
```bash
gcloud run services list --region=us-central1
gcloud run services describe racefacer-backend --region=us-central1
```

### Get URLs
```bash
gcloud run services describe racefacer-backend \
    --region=us-central1 --format='value(status.url)'
```

### Delete (Clean Up)
```bash
gcloud run services delete racefacer-backend --region=us-central1
gcloud run services delete racefacer-frontend --region=us-central1
```

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check logs
gcloud run logs read racefacer-backend --region=us-central1 --limit=100

# Common issues:
# - Image not found: Rebuild image
# - Port mismatch: Must use port 8080
# - Memory limit: Increase in yaml
```

### WebSocket Not Connecting
```bash
# Backend needs:
# - cpu-throttling: false
# - timeoutSeconds: 3600
# - minScale: 1

# Update:
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --cpu-always-allocated \
    --timeout=3600
```

### Frontend Can't Reach Backend
1. Get backend URL
2. Update `js/core/config.js`
3. Rebuild frontend
4. Redeploy

```bash
BACKEND_URL=$(gcloud run services describe racefacer-backend \
    --region=us-central1 --format='value(status.url)')
echo "Update SERVER_URL to: $BACKEND_URL"
```

## 🔒 Security

### HTTPS
✅ **Automatic** - All Cloud Run services get free HTTPS

### Authentication (Optional)
```bash
# Require authentication
gcloud run services update racefacer-backend \
    --no-allow-unauthenticated
```

### Secrets
```bash
# Create secret
echo -n "secret-value" | gcloud secrets create my-secret --data-file=-

# Use in Cloud Run
gcloud run services update racefacer-backend \
    --update-secrets=SECRET_KEY=my-secret:latest
```

## 📊 Monitoring

### Cloud Console
```
https://console.cloud.google.com/run
```

View:
- Request metrics
- CPU/Memory usage
- Error rates
- Logs

### Command Line
```bash
# Service details
gcloud run services describe racefacer-backend --region=us-central1

# Logs
gcloud run logs tail racefacer-backend --region=us-central1

# Revisions
gcloud run revisions list --service=racefacer-backend --region=us-central1
```

## 🎯 Best Practices

### Cost Optimization
1. ✅ Use `minScale: 0` for frontend (scales to zero)
2. ✅ Use `minScale: 1` for backend (WebSocket requires)
3. ✅ Choose us-central1 region (cheapest)
4. ✅ Set appropriate memory limits
5. ✅ Monitor usage regularly

### Performance
1. ✅ Keep backend warm (`minScale: 1`)
2. ✅ Enable CPU always allocated for backend
3. ✅ Use CDN for static assets
4. ✅ Set proper timeout (3600s for WebSocket)

### Reliability
1. ✅ Health checks configured
2. ✅ Startup probes for graceful start
3. ✅ Automatic restarts on failure
4. ✅ Log errors properly

## 🔄 CI/CD (Optional)

### GitHub Actions
Create `.github/workflows/deploy-gcp.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - uses: google-github-actions/auth@v0
      with:
        credentials_json: ${{ secrets.GCP_SA_KEY }}
    
    - name: Deploy
      run: ./deploy-gcp.sh
```

## 📚 Learn More

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Free Tier Details](https://cloud.google.com/free)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Best Practices](https://cloud.google.com/run/docs/best-practices)

## ✅ Deployment Checklist

### Setup
- [ ] Google Cloud account created
- [ ] `gcloud` SDK installed
- [ ] Project created
- [ ] Billing enabled (free tier available)

### Deploy
- [ ] Run `./deploy-gcp.sh`
- [ ] Backend deployed ✅
- [ ] Frontend deployed ✅
- [ ] URLs obtained ✅

### Configure
- [ ] Update `WS_CHANNEL` in backend.yaml
- [ ] Update `SERVER_URL` in js/core/config.js
- [ ] Redeploy frontend
- [ ] Test connection

### Verify
- [ ] Backend connects to RaceFacer
- [ ] Frontend connects to backend
- [ ] Data flows correctly
- [ ] Sessions store properly
- [ ] HTTPS works

## 🎉 Summary

### Files Created
```
├── Dockerfile.backend              # Backend container
├── Dockerfile.frontend             # Frontend container
├── deploy-gcp.sh                   # One-command deploy
└── deployment/
    ├── DEPLOYMENT_GUIDE.md         # Full guide
    └── gcp/
        ├── backend.yaml            # Backend Cloud Run service
        ├── frontend.yaml           # Frontend Cloud Run service
        └── nginx.conf              # Nginx config
```

### What Makes This Great
✅ **Serverless** - No servers to manage
✅ **Auto-scale** - Handles any traffic
✅ **Free Tier** - $0-5/month cost
✅ **HTTPS** - Automatic & free
✅ **Simple** - One command deploy
✅ **Fast** - Global CDN
✅ **Reliable** - 99.95% SLA

### Next Steps
1. Sign up: https://cloud.google.com/
2. Install SDK: https://cloud.google.com/sdk
3. Run: `./deploy-gcp.sh`
4. Done! 🎉

---

**Status**: ✅ READY TO DEPLOY  
**Platform**: Google Cloud Run (Serverless)  
**Cost**: $0-5/month (Free tier available)  
**Deploy Time**: ~5-10 minutes  
**Maintenance**: Zero ✨  

🚀 **Start deploying now!**
