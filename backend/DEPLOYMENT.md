# 🚀 Deployment Guide: Google Cloud

This guide will help you deploy your Leadership Board API to Google Cloud using Cloud Run.

## Prerequisites

1. **Google Cloud Account**: Create a Google Cloud account if you don't have one
2. **Google Cloud CLI**: Install the `gcloud` CLI tool
3. **Docker**: Install Docker on your machine
4. **GitHub OAuth App**: Create a GitHub OAuth application

## Step 1: Set up Google Cloud Project

```bash
# Create a new project (replace with your project ID)
gcloud projects create your-project-id

# Set the project as default
gcloud config set project your-project-id

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Step 2: Set up GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Leadership Board
   - **Homepage URL**: `https://your-frontend-domain.com`
   - **Authorization callback URL**: `https://your-cloud-run-url/api/v1/auth/github/callback`
4. Save the Client ID and Client Secret

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your values:
   ```bash
   GITHUB_CLIENT_ID=your_actual_client_id
   GITHUB_CLIENT_SECRET=your_actual_client_secret
   GITHUB_REDIRECT_URI=https://your-cloud-run-url/api/v1/auth/github/callback
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   FRONTEND_URL=https://your-frontend-domain.com
   GOOGLE_CLOUD_PROJECT=your-project-id
   ```

## Step 4: Deploy to Cloud Run

### Option A: Using the deployment script (Recommended)

1. **Windows Users**: 
   ```cmd
   # Edit deploy-cloud-run.bat and update PROJECT_ID
   deploy-cloud-run.bat
   ```

2. **Linux/Mac Users**:
   ```bash
   # Make script executable
   chmod +x deploy-cloud-run.sh
   
   # Edit deploy-cloud-run.sh and update PROJECT_ID
   ./deploy-cloud-run.sh
   ```

### Option B: Manual deployment

1. **Build and push Docker image**:
   ```bash
   # Set your project ID
   export PROJECT_ID=your-project-id
   
   # Build image
   docker build -t gcr.io/$PROJECT_ID/leadership-board-api .
   
   # Push to registry
   docker push gcr.io/$PROJECT_ID/leadership-board-api
   ```

2. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy leadership-board-api \
     --image gcr.io/$PROJECT_ID/leadership-board-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="GITHUB_CLIENT_ID=your_client_id,GITHUB_CLIENT_SECRET=your_client_secret" \
     --memory 512Mi \
     --cpu 1 \
     --port 8080
   ```

## Step 5: Update Frontend Configuration

After deployment, update your frontend's environment variables:

```javascript
// In your frontend .env.local
NEXT_PUBLIC_BACKEND_URL=https://your-cloud-run-url
```

## Step 6: Set up GitHub Webhook

1. Go to your GitHub repository settings
2. Navigate to Webhooks
3. Add webhook:
   - **Payload URL**: `https://your-cloud-run-url/api/v1/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Your webhook secret
   - **Events**: Select "Pull requests" and "Issues"

## Step 7: Test the Deployment

1. **Health check**: `https://your-cloud-run-url/`
2. **API docs**: `https://your-cloud-run-url/docs`
3. **GitHub auth**: `https://your-cloud-run-url/api/v1/auth/github`

## Monitoring and Logs

- **View logs**: `gcloud logging read "resource.type=cloud_run_revision"`
- **Monitor service**: Google Cloud Console > Cloud Run > leadership-board-api

## Troubleshooting

### Common Issues:

1. **CORS errors**: Make sure your frontend URL is in the CORS origins
2. **OAuth callback mismatch**: Ensure GitHub OAuth callback URL matches your Cloud Run URL
3. **Database issues**: SQLite works for development; consider Cloud SQL for production

### Useful Commands:

```bash
# View service details
gcloud run services describe leadership-board-api --region=us-central1

# Update environment variables
gcloud run services update leadership-board-api \
  --region=us-central1 \
  --set-env-vars="NEW_VAR=value"

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# Delete service
gcloud run services delete leadership-board-api --region=us-central1
```

## Security Notes

- Store sensitive environment variables in Google Secret Manager for production
- Use IAM roles for service-to-service authentication
- Enable Cloud Armor for DDoS protection
- Set up SSL certificates for custom domains

## Cost Optimization

- Cloud Run pricing is based on CPU/memory allocation and request volume
- Use `--cpu-throttling` for cost optimization
- Set appropriate concurrency limits
- Monitor usage in Google Cloud Console

---

🎉 Your Leadership Board API should now be deployed and accessible via the Cloud Run URL!