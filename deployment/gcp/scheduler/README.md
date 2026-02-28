# Cloud Scheduler jobs (tracked)

This directory holds the request bodies for two Cloud Scheduler HTTP jobs that toggle Cloud Run autoscaling annotations on `racefacer-backend`.

- backend-scale-up (Tue–Sun 10:00 Australia/Melbourne)
  - Sets `autoscaling.knative.dev/minScale: "1"`
  - Sets `run.googleapis.com/cpu-throttling: "false"`
- backend-scale-down (Tue–Sun 22:00 Australia/Melbourne)
  - Sets `autoscaling.knative.dev/minScale: "0"`
  - Sets `run.googleapis.com/cpu-throttling: "true"`

The deployment scripts (`deploy-gcp.sh`, `deploy-gcp.ps1`) read these files and create/update the jobs:
- `deployment/gcp/scheduler/body-scale-up.json`
- `deployment/gcp/scheduler/body-scale-down.json`

You can adjust schedules by changing the cron lines in the deploy scripts if needed.



