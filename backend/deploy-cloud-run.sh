#!/bin/bash

# Google Cloud deployment script for Cloud Run
# Make sure you have gcloud CLI installed and authenticated

# Set your project variables
PROJECT_ID="leadership-board-api"
SERVICE_NAME="leadership-board-api"
REGION="us-central1"

echo "🚀 Deploying Leadership Board API to Google Cloud Run..."

# Build and push Docker image
echo "Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME .

echo "Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="GITHUB_CLIENT_ID=your_github_client_id_here,GITHUB_CLIENT_SECRET=your_github_client_secret_here,GITHUB_REDIRECT_URI=https://YOUR_CLOUD_RUN_URL/api/v1/auth/github/callback,GITHUB_TOKEN=your_github_personal_access_token_here,GITHUB_WEBHOOK_SECRET=your_webhook_secret_here,FRONTEND_URL=https://your-frontend-domain.com" \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 100 \
  --timeout 300 \
  --port 8080

echo "✅ Deployment complete!"
echo "Your API is available at: https://$SERVICE_NAME-$REGION-$PROJECT_ID.a.run.app"