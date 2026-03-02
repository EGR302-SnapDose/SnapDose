#!/bin/bash
# SnapDose Pipeline – deploy script

PROJECT_ID="egr302-snapdose"
BUCKET_NAME="snapdose-meal-images"
REGION="us-central1"
FUNCTION_NAME="snapdose-uploads"

gcloud config set project $PROJECT_ID

echo "=== Enabling required APIs ==="
gcloud services enable \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com \
  run.googleapis.com \
  eventarc.googleapis.com

echo "=== Creating GCS bucket (skip if exists) ==="
gcloud storage buckets create gs://$BUCKET_NAME \
  --location=$REGION \
  --uniform-bucket-level-access 2>/dev/null || echo "Bucket already exists, continuing..."

echo "=== Deploying Cloud Function ==="
gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --runtime=python311 \
  --region=$REGION \
  --source=. \
  --entry-point=on_image_upload \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=$BUCKET_NAME" \
  --remove-env-vars="GEMINI_API_KEY" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --memory=512MB \
  --timeout=120s

echo ""
echo "=== Done! ==="
echo "Test by uploading a food image:"
echo "  gcloud storage cp your_food.jpg gs://$BUCKET_NAME/"
echo "Watch logs:"
echo "  gcloud functions logs read $FUNCTION_NAME --region=$REGION --limit=50"