# 🚀 Google Cloud Platform Deployment Guide

## Overview

Deploy RaceFacer to Google Cloud Platform using **Cloud Run** (serverless) - perfect for the free tier!

### Why Cloud Run?
- ✅ **Always Free Tier**: 2 million requests/month free
- ✅ **Serverless**: No infrastructure management
- ✅ **Auto-scaling**: Scales to zero when idle
- ✅ **HTTPS Built-in**: Automatic TLS certificates
- ✅ **Simple**: One command deployment

---

## 📦 Google Cloud Free Tier

### What's Included (Always Free)
- **Cloud Run**: 2M requests/month, 360,000 GB-seconds, 180,000 vCPU-seconds
- **Cloud Build**: 120 build-minutes/day
- **Container Registry**: 0.5 GB storage
- **Cloud Storage**: 5 GB storage
- **Networking**: 1 GB egress/month (Americas)

### Cost Estimate
**Our App**:
- Backend: ~$0-5/month (depends on traffic)
- Frontend: ~$0 (static files, minimal resources)
- Storage: ~$0 (under 5GB)

**With light usage, stays FREE!** ✅

---

## 🎯 Prerequisites

### 1. Google Cloud Account
```bash
# Sign up at: https://cloud.google.com/
# Free trial: $300 credit for 90 days
# After trial: Always Free tier continues
```

### 2. Install Google Cloud SDK
```bash
# Download and install from:
https://cloud.google.com/sdk/docs/install

# Verify installation
gcloud --version
```

### 3. Login and Setup
```bash
# Login to Google Cloud
gcloud auth login

# Create project (or use existing)
gcloud projects create racefacer-app --name="RaceFacer"

# Set project
gcloud config set project racefacer-app

# Enable billing (required, but free tier available)
# Go to: https://console.cloud.google.com/billing
```

---

## 🚀 Quick Deploy (Recommended)

### One-Command Deployment

```bash
# Make script executable (Linux/Mac)
chmod +x deploy-gcp.sh

# Run deployment
./deploy-gcp.sh
```

**What it does**:
1. ✅ Enables required APIs
2. ✅ Builds Docker images
3. ✅ Deploys to Cloud Run
4. ✅ Sets up HTTPS automatically
5. ✅ Provides public URLs

**Time**: ~5-10 minutes

---

## 📝 Manual Deployment

### Step 1: Enable APIs

```bash
gcloud services enable run.googleapis.com \
    containerregistry.googleapis.com \
    cloudbuild.googleapis.com
```

### Step 2: Build Images

```bash
# Build backend
gcloud builds submit \
    --tag gcr.io/YOUR_PROJECT_ID/racefacer-backend:latest \
    --file Dockerfile.backend \
    .

# Build frontend
gcloud builds submit \
    --tag gcr.io/YOUR_PROJECT_ID/racefacer-frontend:latest \
    --file Dockerfile.frontend \
    .
```

**Free Tier**: 120 build-minutes/day ✅

### Step 3: Deploy Backend

```bash
# Update manifest with your project ID
sed "s/PROJECT_ID/YOUR_PROJECT_ID/g" \
    deployment/gcp/backend.yaml > /tmp/backend.yaml

# Deploy
gcloud run services replace /tmp/backend.yaml \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated
```

### Step 4: Deploy Frontend

```bash
# Update manifest
sed "s/PROJECT_ID/YOUR_PROJECT_ID/g" \
    deployment/gcp/frontend.yaml > /tmp/frontend.yaml

# Deploy
gcloud run services replace /tmp/frontend.yaml \
    --region=us-central1 \
    --platform=managed \
    --allow-unauthenticated
```

### Step 5: Get URLs

```bash
# Backend URL
gcloud run services describe racefacer-backend \
    --region=us-central1 \
    --format='value(status.url)'

# Frontend URL
gcloud run services describe racefacer-frontend \
    --region=us-central1 \
    --format='value(status.url)'
```

---

## ⚙️ Configuration

### 1. Update RaceFacer Channel

Edit `deployment/gcp/backend.yaml`:
```yaml
- name: WS_CHANNEL
  value: "lemansentertainment"  # Change to your channel
```

### 2. Update Frontend Backend URL

After deploying backend, get its URL:
```bash
BACKEND_URL=$(gcloud run services describe racefacer-backend \
    --region=us-central1 --format='value(status.url)')
echo $BACKEND_URL
```

Edit `js/core/config.js`:
```javascript
export const CONFIG = {
    BACKEND_MODE: true,
    SERVER_URL: 'https://racefacer-backend-xxxxx-uc.a.run.app'  // Your backend URL
};
```

Rebuild and redeploy frontend:
```bash
gcloud builds submit \
    --tag gcr.io/YOUR_PROJECT_ID/racefacer-frontend:latest \
    --file Dockerfile.frontend .

gcloud run services replace /tmp/frontend.yaml \
    --region=us-central1 --platform=managed --allow-unauthenticated
```

---

## 📊 Monitoring

### View Logs

```bash
# Backend logs (live)
gcloud run logs tail racefacer-backend --region=us-central1

# Frontend logs
gcloud run logs tail racefacer-frontend --region=us-central1

# Last 50 entries
gcloud run logs read racefacer-backend --region=us-central1 --limit=50
```

### Check Status

```bash
# List services
gcloud run services list --region=us-central1

# Describe service
gcloud run services describe racefacer-backend --region=us-central1
```

### View in Console

```bash
# Open Cloud Run console
gcloud run services list --uri
# Or visit: https://console.cloud.google.com/run
```

---

## 🔧 Advanced Configuration

### Update Environment Variables

```bash
# Update backend config
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --set-env-vars="WS_CHANNEL=your-channel"

# Multiple vars
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --set-env-vars="WS_CHANNEL=channel1,LOG_LEVEL=debug"
```

### Scale Configuration

```bash
# Set min/max instances
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --min-instances=1 \
    --max-instances=1  # Backend must be 1 (WebSocket)

# Frontend can scale
gcloud run services update racefacer-frontend \
    --region=us-central1 \
    --min-instances=0 \
    --max-instances=5
```

### Resource Limits

```bash
# Update memory
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --memory=512Mi

# Update CPU
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --cpu=1
```

---

## 💾 Persistent Storage (Optional)

Cloud Run is stateless, but you can add Cloud Storage:

### 1. Create Storage Bucket

```bash
# Create bucket
gsutil mb -l us-central1 gs://racefacer-storage

# Set lifecycle (delete old sessions)
gsutil lifecycle set deployment/gcp/lifecycle.json gs://racefacer-storage
```

### 2. Mount in Cloud Run

Update `deployment/gcp/backend.yaml`:
```yaml
volumes:
- name: storage
  cloudStorage:
    bucket: racefacer-storage
    readOnly: false

volumeMounts:
- name: storage
  mountPath: /app/storage
```

**Free Tier**: 5 GB storage ✅

---

## 🌐 Custom Domain (Optional)

### Map Custom Domain

```bash
# Add domain mapping
gcloud run domain-mappings create \
    --service=racefacer-frontend \
    --domain=racefacer.yourdomain.com \
    --region=us-central1

# Follow instructions to update DNS
```

**HTTPS**: Automatically provisioned ✅

---

## 🐛 Troubleshooting

### Service Not Starting

```bash
# Check logs
gcloud run logs read racefacer-backend --region=us-central1 --limit=100

# Common issues:
# - Image not found: Check build succeeded
# - Permission denied: Check IAM roles
# - Out of memory: Increase memory limit
```

### WebSocket Connection Issues

```bash
# Backend must have:
# - cpu-throttling: false
# - timeoutSeconds: 3600 (1 hour)
# - minScale: 1 (always running)

# Update:
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --cpu-always-allocated \
    --timeout=3600 \
    --min-instances=1
```

### Frontend Can't Connect to Backend

```bash
# Check backend URL
gcloud run services describe racefacer-backend \
    --region=us-central1 \
    --format='value(status.url)'

# Update js/core/config.js with this URL
# Rebuild and redeploy frontend
```

### Cold Starts

```bash
# Keep backend warm (costs ~$5/month)
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --min-instances=1

# Frontend can cold start (free)
```

---

## 💰 Cost Optimization

### Free Tier Tips

1. **Set min-instances=0 for frontend**
   - Scales to zero when idle
   - Stays free

2. **Use min-instances=1 for backend**
   - Necessary for WebSocket
   - ~$5/month cost

3. **Choose us-central1 region**
   - Free tier eligible
   - Lowest costs

4. **Monitor usage**
```bash
gcloud run services describe racefacer-backend \
    --region=us-central1 \
    --format='get(status.traffic)'
```

### Estimated Costs

**With Free Tier**:
- Frontend: $0 (under free limits)
- Backend: $0-10/month (depends on traffic)
- Storage: $0 (under 5GB)
- **Total: $0-10/month** ✅

**Compare to**:
- OpenShift: Free (30-day sandbox)
- AWS EKS: $75-150/month
- AWS EC2: $10-20/month

**GCP Cloud Run = Best price/performance!**

---

## 🔒 Security

### Authentication (Optional)

```bash
# Require authentication
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --no-allow-unauthenticated

# Create service account
gcloud iam service-accounts create racefacer-client

# Grant access
gcloud run services add-iam-policy-binding racefacer-backend \
    --region=us-central1 \
    --member='serviceAccount:racefacer-client@PROJECT_ID.iam.gserviceaccount.com' \
    --role='roles/run.invoker'
```

### Secrets Management

```bash
# Create secret
echo -n "your-secret" | gcloud secrets create racefacer-secret --data-file=-

# Use in Cloud Run
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --update-secrets=SECRET_KEY=racefacer-secret:latest
```

---

## 📈 Scaling

### Auto-Scaling

Cloud Run auto-scales based on:
- Request concurrency
- CPU utilization
- Memory usage

**Default**: Scales 0-100 instances

**Our Config**:
- Frontend: 0-5 instances (can scale to zero)
- Backend: 1-1 instance (persistent WebSocket)

### Load Testing

```bash
# Install hey
go install github.com/rakyll/hey@latest

# Test frontend
hey -n 1000 -c 10 https://YOUR_FRONTEND_URL/health

# Test backend
hey -n 1000 -c 10 https://YOUR_BACKEND_URL/health
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Google Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - uses: google-github-actions/setup-gcloud@v0
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}
    
    - name: Build and Deploy
      run: |
        gcloud builds submit \
          --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/racefacer-backend
        gcloud run deploy racefacer-backend \
          --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/racefacer-backend \
          --region us-central1 \
          --platform managed
```

---

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Free Tier Details](https://cloud.google.com/free)
- [Pricing Calculator](https://cloud.google.com/products/calculator)
- [Best Practices](https://cloud.google.com/run/docs/best-practices)

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Google Cloud account created
- [ ] Billing enabled (free tier available)
- [ ] `gcloud` SDK installed
- [ ] Project created and set
- [ ] APIs enabled

### Deployment
- [ ] Backend image built
- [ ] Frontend image built
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Cloud Run
- [ ] URLs obtained

### Configuration
- [ ] Frontend SERVER_URL updated
- [ ] Frontend rebuilt and redeployed
- [ ] Backend connects to RaceFacer
- [ ] UI connects to backend
- [ ] Data flows correctly

### Post-Deployment
- [ ] Health checks passing
- [ ] Logs show connections
- [ ] Sessions storing correctly
- [ ] Results tab working
- [ ] HTTPS working

---

## 🎉 Quick Reference

```bash
# Deploy everything
./deploy-gcp.sh

# View logs
gcloud run logs tail racefacer-backend --region=us-central1

# Update config
gcloud run services update racefacer-backend \
    --region=us-central1 \
    --set-env-vars="WS_CHANNEL=your-channel"

# Get URLs
gcloud run services list --region=us-central1

# Delete services
gcloud run services delete racefacer-backend --region=us-central1
gcloud run services delete racefacer-frontend --region=us-central1
```

---

**Google Cloud Run = Simple + Cheap + Scalable!** ✨
