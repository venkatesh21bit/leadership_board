# Google Cloud Setup Verification Script

# Add gcloud to PATH
$env:PATH += ";C:\Users\$env:USERNAME\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

Write-Host "🔍 Verifying Google Cloud Setup..." -ForegroundColor Green
Write-Host ""

# Check gcloud installation
Write-Host "1. Checking gcloud installation..." -ForegroundColor Yellow
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-String "Google Cloud SDK"
    Write-Host "✅ $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ gcloud not found" -ForegroundColor Red
}

# Check authentication
Write-Host "`n2. Checking authentication..." -ForegroundColor Yellow
try {
    $account = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>&1
    if ($account) {
        Write-Host "✅ Authenticated as: $account" -ForegroundColor Green
    } else {
        Write-Host "❌ Not authenticated" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Authentication check failed" -ForegroundColor Red
}

# Check current project
Write-Host "`n3. Checking current project..." -ForegroundColor Yellow
try {
    $project = gcloud config get-value project 2>&1
    Write-Host "✅ Current project: $project" -ForegroundColor Green
} catch {
    Write-Host "❌ No project set" -ForegroundColor Red
}

# Check enabled APIs
Write-Host "`n4. Checking enabled APIs..." -ForegroundColor Yellow
$requiredApis = @(
    "cloudbuild.googleapis.com",
    "run.googleapis.com", 
    "containerregistry.googleapis.com",
    "artifactregistry.googleapis.com"
)

foreach ($api in $requiredApis) {
    try {
        $enabled = gcloud services list --enabled --filter="name:$api" --format="value(name)" 2>&1
        if ($enabled) {
            Write-Host "✅ $api" -ForegroundColor Green
        } else {
            Write-Host "❌ $api (not enabled)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $api (check failed)" -ForegroundColor Red
    }
}

# Check Docker
Write-Host "`n5. Checking Docker..." -ForegroundColor Yellow
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerVersion = docker --version
        Write-Host "✅ $dockerVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker not running" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Docker not installed" -ForegroundColor Red
}

# Check billing
Write-Host "`n6. Checking billing..." -ForegroundColor Yellow
try {
    $billing = gcloud billing projects describe leadership-board-api --format="value(billingEnabled)" 2>&1
    if ($billing -eq "True") {
        Write-Host "✅ Billing enabled" -ForegroundColor Green
    } else {
        Write-Host "❌ Billing not enabled" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Billing check failed" -ForegroundColor Red
}

Write-Host "`n🎯 Setup Summary:" -ForegroundColor Cyan
Write-Host "Project ID: leadership-board-api" -ForegroundColor White
Write-Host "Region: us-central1" -ForegroundColor White
Write-Host "Service Name: leadership-board-api" -ForegroundColor White
Write-Host ""
Write-Host "Next step: Run ./deploy.ps1 (after starting Docker Desktop)" -ForegroundColor Yellow