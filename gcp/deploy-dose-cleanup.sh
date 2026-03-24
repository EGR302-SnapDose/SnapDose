#!/bin/bash
# SnapDose – Dose Cleanup Function deploy script

PROJECT_ID="egr302-snapdose"
REGION="us-central1"
FUNCTION_NAME="delete-expired-doses"

gcloud config set project $PROJECT_ID

echo "=== Enabling required APIs ==="
gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  cloudscheduler.googleapis.com \
  run.googleapis.com

echo "=== Deploying $FUNCTION_NAME ==="
gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --runtime=nodejs20 \
  --region=$REGION \
  --source=. \
  --entry-point=deleteExpiredDoses \
  --trigger-http \
  --memory=256MB \
  --timeout=120s

echo "=== Creating Cloud Scheduler job ==="
gcloud scheduler jobs create http dose-cleanup-scheduler \
  --location=$REGION \
  --schedule="0 * * * *" \
  --uri="https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME" \
  --http-method=GET

echo ""
echo "=== Done! ==="
echo "Watch logs:"
echo "  gcloud functions logs read $FUNCTION_NAME --region=$REGION --limit=50"