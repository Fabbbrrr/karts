# Deployment Quick Reference

## 🚨 What Changed

The old deployment script was **falsely reporting success** - builds completed but GCP services weren't actually updated.

## ✅ The Fix

The new script:
1. **Uses unique timestamp tags** (e.g., `20241103-143052`) instead of `:latest`
2. **Verifies deployment happened** by checking revision IDs before/after
3. **Fails if no new revision created** - no more false positives
4. **Tests health endpoints** to confirm services are responding
5. **Shows before/after comparison** of revisions

## 📋 How to Deploy

```powershell
# Deploy everything (with verification)
.\deploy.ps1

# Check current deployment state
.\verify-deployment.ps1
```

## 🔍 What Success Looks Like

```
VERIFICATION RESULTS
------------------------------------------------------------
  [✓] Backend revision changed: ...00042 -> ...00043
  [✓] Frontend revision changed: ...00031 -> ...00032
  [✓] Using unique image tags: 20241103-143052
  [✓] Images verified in registry
  [✓] Services marked as ready
```

## ❌ What Failure Looks Like

```
[X] NO NEW REVISION - DEPLOYMENT FAILED!
This means Cloud Run is still using the old version.
```

**Script will exit with error code 1** - deployment did NOT happen.

## 🔧 Troubleshooting

### Check What's Actually Running

```powershell
# See current revision
gcloud run services describe racefacer-backend --region=us-central1 --format="value(status.latestCreatedRevisionName)"

# See actual image being used
gcloud run services describe racefacer-backend --region=us-central1 --format="value(spec.template.spec.containers[0].image)"

# List all revisions with timestamps
gcloud run revisions list --service=racefacer-backend --region=us-central1
```

### View Recent Deployments

```powershell
# List images with timestamps
gcloud container images list-tags gcr.io/YOUR_PROJECT/racefacer-backend --limit=10
```

### Rollback if Needed

```powershell
# List revisions
gcloud run revisions list --service=racefacer-backend --region=us-central1

# Route traffic to previous revision
gcloud run services update-traffic racefacer-backend --to-revisions=REVISION_NAME=100 --region=us-central1
```

## 📊 Key Metrics to Watch

After deployment, check:
- ✅ Revision name changed
- ✅ Image tag matches deployment timestamp
- ✅ Service status = READY
- ✅ Health endpoint responds
- ✅ Last update time = recent

## 💡 Why This Matters

**Before**: Script said "SUCCESS!" but services were 2 days old
**After**: Script verifies actual deployment or fails with clear error

No more mystery deployments!

## 📚 Full Details

See `DEPLOYMENT_SCRIPT_REWORK.md` for complete explanation of changes.



