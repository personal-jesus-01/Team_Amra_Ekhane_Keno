@echo off
REM SlideBanai Quick Deploy Script for Windows
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   SlideBanai Deployment Script
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please create .env with required variables:
    echo   - DATABASE_URL
    echo   - FIREBASE_PROJECT_ID
    echo   - FIREBASE_PRIVATE_KEY
    echo   - FIREBASE_CLIENT_EMAIL
    echo   - OPENAI_API_KEY
    echo   - SESSION_SECRET
    exit /b 1
)

echo [OK] Configuration found
echo.

REM Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Build application
echo Building application...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    exit /b 1
)
echo [OK] Build completed
echo.

REM Choose deployment method
echo Select deployment target:
echo 1) Google Cloud Run (Recommended)
echo 2) Google App Engine
echo 3) Docker (Self-Hosted)
echo 4) Local Development
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Deploying to Google Cloud Run...
    echo.
    
    REM Check if gcloud is installed
    where gcloud >nul 2>nul
    if errorlevel 1 (
        echo [ERROR] gcloud CLI not installed!
        echo Install from: https://cloud.google.com/sdk/docs/install
        exit /b 1
    )
    
    REM Get project ID
    for /f "tokens=*" %%A in ('gcloud config get-value project') do set PROJECT_ID=%%A
    
    if "!PROJECT_ID!"=="" (
        set /p PROJECT_ID="Enter GCP Project ID: "
    )
    
    echo Project ID: !PROJECT_ID!
    echo.
    
    REM Build and push Docker image
    echo Building Docker image...
    call docker build -t gcr.io/!PROJECT_ID!/slidebanai:latest .
    if errorlevel 1 (
        echo [ERROR] Docker build failed
        exit /b 1
    )
    
    echo Pushing to Container Registry...
    call docker push gcr.io/!PROJECT_ID!/slidebanai:latest
    if errorlevel 1 (
        echo [ERROR] Docker push failed
        exit /b 1
    )
    
    REM Deploy to Cloud Run
    echo Deploying to Cloud Run...
    call gcloud run deploy slidebanai ^
      --image gcr.io/!PROJECT_ID!/slidebanai:latest ^
      --region us-central1 ^
      --platform managed ^
      --memory 2Gi ^
      --timeout 300 ^
      --allow-unauthenticated ^
      --port 5000
    
    if errorlevel 1 (
        echo [ERROR] Cloud Run deployment failed
        exit /b 1
    )
    
    echo [OK] Deployed to Cloud Run!
    echo.
    echo View your app:
    call gcloud run services describe slidebanai --region us-central1 --format="value(status.url)"
    
) else if "%choice%"=="2" (
    echo.
    echo Deploying to Google App Engine...
    echo.
    
    where gcloud >nul 2>nul
    if errorlevel 1 (
        echo [ERROR] gcloud CLI not installed!
        exit /b 1
    )
    
    call gcloud app deploy app.yaml --quiet
    if errorlevel 1 (
        echo [ERROR] App Engine deployment failed
        exit /b 1
    )
    
    echo [OK] Deployed to App Engine!
    call gcloud app browse
    
) else if "%choice%"=="3" (
    echo.
    echo Building Docker image...
    echo.
    
    where docker >nul 2>nul
    if errorlevel 1 (
        echo [ERROR] Docker not installed!
        echo Install from: https://www.docker.com/products/docker-desktop
        exit /b 1
    )
    
    call docker build -t slidebanai:latest .
    if errorlevel 1 (
        echo [ERROR] Docker build failed
        exit /b 1
    )
    
    echo [OK] Docker image built!
    echo.
    echo Run with:
    echo docker run -p 5000:5000 ^
    echo   -e DATABASE_URL=%%DATABASE_URL%% ^
    echo   -e FIREBASE_PROJECT_ID=%%FIREBASE_PROJECT_ID%% ^
    echo   -e FIREBASE_PRIVATE_KEY=%%FIREBASE_PRIVATE_KEY%% ^
    echo   -e FIREBASE_CLIENT_EMAIL=%%FIREBASE_CLIENT_EMAIL%% ^
    echo   -e OPENAI_API_KEY=%%OPENAI_API_KEY%% ^
    echo   -e SESSION_SECRET=%%SESSION_SECRET%% ^
    echo   slidebanai:latest
    
) else if "%choice%"=="4" (
    echo.
    echo Starting local development servers...
    echo.
    call npm run dev
    
) else (
    echo Invalid choice
    exit /b 1
)

echo.
echo ========================================
echo [OK] Deployment process complete!
echo ========================================
echo.
echo Documentation:
echo - Deployment Guide: PRODUCTION_DEPLOYMENT.md
echo - Status Report: DEPLOYMENT_STATUS.md
echo - API Documentation: API_DOCUMENTATION.md
echo - Swagger UI: swagger-ui.html
echo.

endlocal
