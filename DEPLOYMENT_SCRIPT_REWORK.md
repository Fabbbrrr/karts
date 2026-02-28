# Deployment Script Complete Rework

## Problem Identified

The previous `deploy.ps1` script was **falsely reporting success** without actually deploying new code to GCP. The services showed "last updated 2 days ago" even though the script claimed everything was deployed successfully.

### Root Causes

1. **Image Tag Problem**: Script built images with unique tags (`BUILD_ID`) but deployed using `:latest` tag
   - Cloud Run would see `:latest` hadn't changed and skip pulling the new image
   - Even though new images were built, they weren't being used

2. **No Verification**: Script only checked if commands succeeded, not if deployments actually happened
   - `gcloud run services replace` succeeds even if no new revision is created
   - No check for revision changes or timestamps

3. **False Positives**: Script reported success based on command exit codes alone
   - Commands can succeed without deploying anything new
   - No validation that services were actually updated

## What Was Fixed

### 1. Unique Image Tags in Deployment

**Before:**
```yaml
# Built with unique tag
image: gcr.io/PROJECT/racefacer-backend:BUILD_ID

# But deployed with
image: gcr.io/PROJECT/racefacer-backend:latest  # ← Cloud Run sees no change!
```

**After:**
```yaml
# Built with unique timestamp tag
image: gcr.io/PROJECT/racefacer-backend:20241103-143052

# Deployed with same unique tag
image: gcr.io/PROJECT/racefacer-backend:20241103-143052  # ← Forces new revision!
```

### 2. Deployment Verification

The new script **actually verifies** deployments happened:

```powershell
# Get service state BEFORE deployment
$backendBefore = "revision-xyz-abc"

# Deploy...

# Get service state AFTER deployment  
$backendAfter = "revision-xyz-def"

# VERIFY they're different
if ($backendAfter -ne $backendBefore) {
    Write-Success "NEW REVISION DEPLOYED"
} else {
    Write-Error "NO DEPLOYMENT HAPPENED!"
    exit 1
}
```

### 3. Image Verification

```powershell
# Build image...

# VERIFY image actually exists in registry
gcloud container images describe "gcr.io/$projectId/racefacer-backend:$deploymentTag"
if ($LASTEXITCODE -eq 0) {
    Write-Success "IMAGE VERIFIED"
} else {
    Write-Error "IMAGE NOT FOUND - BUILD FAILED!"
    exit 1
}
```

### 4. Service Readiness Checks

```powershell
# Wait for service to be actually ready
$maxWait = 60
while ($waited -lt $maxWait) {
    $status = gcloud run services describe ... --format="value(status.conditions[0].status)"
    if ($status -eq "True") {
        break  # Service is ready
    }
    Start-Sleep -Seconds 2
}
```

### 5. Health Endpoint Testing

```powershell
# Test backend is actually responding
$healthResponse = Invoke-RestMethod -Uri "$backendUrl/health"
# Only report success if backend responds
```

## New Script Features

### Timestamp-Based Unique Tags

```powershell
$deploymentTag = Get-Date -Format "yyyyMMdd-HHmmss"
# Example: 20241103-143052
```

Every deployment gets a unique, human-readable tag that:
- Forces Cloud Run to pull new images
- Makes deployments traceable
- Allows easy rollback to specific timestamps

### Before/After Comparison

```
Checking Backend Deployment:
  [✓] NEW REVISION DEPLOYED
  Before: racefacer-backend-00042-xyz
  After:  racefacer-backend-00043-abc
  Image:  gcr.io/project/racefacer-backend:20241103-143052
  [✓] Using correct image tag: 20241103-143052
```

### Failure Detection

If no new revision is created, script **fails immediately**:
```
[X] NO NEW REVISION - DEPLOYMENT FAILED!
This means Cloud Run is still using the old version.
```

### Cloud Build Configuration Updates

**cloudbuild.backend.yaml** and **cloudbuild.frontend.yaml** now support custom tags:

```yaml
substitutions:
  _TAG_NAME: 'latest'  # Default

steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/racefacer-backend:${_TAG_NAME}'  # Uses custom tag
      - '-t'  
      - 'gcr.io/$PROJECT_ID/racefacer-backend:$BUILD_ID'     # Also BUILD_ID
      - '-t'
      - 'gcr.io/$PROJECT_ID/racefacer-backend:latest'        # And latest
```

Images are tagged three ways:
1. **Custom timestamp tag** - Used for deployment
2. **BUILD_ID** - Cloud Build's unique ID
3. **latest** - For convenience

## How to Use

### Deploy Everything

```powershell
.\deploy.ps1
```

The script will:
1. ✓ Validate environment
2. ✓ Generate unique deployment tag
3. ✓ Record current service states
4. ✓ Build backend with unique tag
5. ✓ Deploy backend with unique tag
6. ✓ Build frontend with unique tag
7. ✓ Deploy frontend with unique tag
8. ✓ **Verify both services got new revisions**
9. ✓ Test backend health endpoint
10. ✓ Display before/after comparison

### What Success Looks Like

```
============================================================
        [✓ SUCCESS] DEPLOYMENT VERIFIED & COMPLETE         
============================================================

VERIFICATION RESULTS
------------------------------------------------------------
  [✓] Backend revision changed: ...00042 -> ...00043
  [✓] Frontend revision changed: ...00031 -> ...00032
  [✓] Using unique image tags: 20241103-143052
  [✓] Images verified in registry
  [✓] Services marked as ready
```

### What Failure Looks Like

```
[X] NO NEW REVISION - DEPLOYMENT FAILED!
This means Cloud Run is still using the old version.
```

**Script exits with error code 1** - CI/CD will properly fail.

## Troubleshooting

### Check Actual Service State

```powershell
# View current revisions
gcloud run revisions list --service=racefacer-backend --region=us-central1

# Check what image is being used
gcloud run services describe racefacer-backend --region=us-central1 --format="value(spec.template.spec.containers[0].image)"
```

### View Deployment History

```powershell
# List all backend images
gcloud container images list-tags gcr.io/YOUR_PROJECT/racefacer-backend

# See all revisions with timestamps
gcloud run revisions list --service=racefacer-backend --region=us-central1 --format="table(metadata.name,status.conditions[0].lastTransitionTime,spec.containers[0].image)"
```

### Force Specific Tag

If you need to deploy a specific version:

```powershell
# Build with specific tag
gcloud builds submit --config cloudbuild.backend.yaml --substitutions=_TAG_NAME=20241103-143052 .

# Update deployment yaml manually to use that tag
# Then deploy
```

## Key Differences Summary

| Old Script | New Script |
|------------|------------|
| ❌ Deployed using `:latest` tag | ✅ Deploys using unique timestamp tags |
| ❌ No verification of deployment | ✅ Verifies revision changes |
| ❌ False success reports | ✅ Fails if no new revision created |
| ❌ No image verification | ✅ Verifies images in registry |
| ❌ No readiness checks | ✅ Waits for services to be ready |
| ❌ No health testing | ✅ Tests backend health endpoint |
| ❌ No before/after comparison | ✅ Shows exact revision changes |

## Why This Matters

### Cost Implications

**Before**: You thought you were deploying new code, but:
- Users were seeing old bugs you thought you fixed
- Time wasted debugging "fixes" that weren't deployed
- Repeated deployments trying to make it work

**After**: You know immediately if deployment succeeded:
- If verification fails, you know right away
- No wasted time debugging phantom issues
- Confidence that deployed code matches your local changes

### CI/CD Integration

The new script properly exits with error codes:
- Exit 0 = Verified successful deployment
- Exit 1 = Deployment failed or not verified

This makes it safe for CI/CD pipelines.

## Additional Resources

### View Live Logs

```powershell
# Backend logs (live tail)
gcloud run logs tail racefacer-backend --region=us-central1

# Frontend logs
gcloud run logs tail racefacer-frontend --region=us-central1
```

### Rollback if Needed

```powershell
# List revisions
gcloud run revisions list --service=racefacer-backend --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic racefacer-backend `
  --to-revisions=racefacer-backend-00042=100 `
  --region=us-central1
```

### Delete Old Images (Clean Up)

```powershell
# List old images
gcloud container images list-tags gcr.io/YOUR_PROJECT/racefacer-backend

# Delete images older than 30 days
gcloud container images list-tags gcr.io/YOUR_PROJECT/racefacer-backend `
  --filter="timestamp.datetime < $(Get-Date).AddDays(-30)" `
  --format="get(digest)" | ForEach-Object {
    gcloud container images delete "gcr.io/YOUR_PROJECT/racefacer-backend@$_" --quiet
}
```

## Files Changed

1. **deploy.ps1** - Completely rewritten with verification
2. **cloudbuild.backend.yaml** - Added `_TAG_NAME` substitution support
3. **cloudbuild.frontend.yaml** - Added `_TAG_NAME` substitution support

## Next Steps

1. **Test the new deployment script**:
   ```powershell
   .\deploy.ps1
   ```

2. **Verify the output** shows new revisions being created

3. **Check GCP Console** to confirm new revisions are listed

4. **Test your application** to confirm new code is running

The script will now correctly fail if GCP doesn't actually update the services, ensuring you always know the true deployment state.



