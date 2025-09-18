# PowerShell deployment script for Google Cloud Run
# Run this after starting Docker Desktop

# Add gcloud to PATH
$env:PATH += ";C:\Users\$env:USERNAME\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

# Project configuration
$PROJECT_ID = "leadership-board-api"
$SERVICE_NAME = "leadership-board-api"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "🚀 Deploying Leadership Board API to Google Cloud Run..." -ForegroundColor Green

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not available. Please install and start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Set the correct project
Write-Host "Setting Google Cloud project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Build Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t $IMAGE_NAME .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

# Push to Google Container Registry
Write-Host "Pushing image to Google Container Registry..." -ForegroundColor Yellow
docker push $IMAGE_NAME
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed" -ForegroundColor Red
    exit 1
}

# Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
  --image $IMAGE_NAME `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --set-env-vars="GITHUB_CLIENT_ID=your_github_client_id_here,GITHUB_CLIENT_SECRET=your_github_client_secret_here,GITHUB_REDIRECT_URI=https://$SERVICE_NAME-$($REGION.Replace('-', ''))-820438968871.a.run.app/api/v1/auth/github/callback,GITHUB_TOKEN=your_github_personal_access_token_here,GITHUB_WEBHOOK_SECRET=your_webhook_secret_here,FRONTEND_URL=https://your-frontend-domain.com" `
  --memory 512Mi `
  --cpu 1 `
  --concurrency 100 `
  --timeout 300 `
  --port 8080

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host "Your API is available at: https://$SERVICE_NAME-$($REGION.Replace('-', ''))-820438968871.a.run.app" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Set up GitHub OAuth app with callback URL: https://$SERVICE_NAME-$($REGION.Replace('-', ''))-820438968871.a.run.app/api/v1/auth/github/callback" -ForegroundColor White
    Write-Host "2. Update environment variables with your GitHub OAuth credentials" -ForegroundColor White
    Write-Host "3. Update frontend NEXT_PUBLIC_BACKEND_URL to point to your Cloud Run URL" -ForegroundColor White
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}