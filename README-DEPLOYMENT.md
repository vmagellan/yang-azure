# Deployment Guide

This document outlines the CLI-based deployment process for both the frontend and backend components of the application.

## Prerequisites

- Azure CLI installed and logged in (`az login`)
- Node.js and npm installed
- Access to the Azure subscription
- Static Web Apps deployment token (available in the Azure Portal)

## Unified Deployment Script

A unified deployment script `deploy.sh` has been created to streamline the deployment process for both frontend and backend components.

### How to Use the Deployment Script

1. Make the script executable (first time only):
   ```bash
   chmod +x deploy.sh
   ```

2. Run the script:
   ```bash
   ./deploy.sh
   ```

3. The script will present a menu with the following options:
   - Deploy Backend Only
   - Deploy Frontend Only
   - Deploy Both (Backend first, then Frontend)
   - Exit

4. When prompted, enter your Static Web Apps deployment token.
   - You can find this token in the Azure Portal under your Static Web App → Overview → Manage deployment token

### What the Script Does

#### Backend Deployment
1. Creates a clean deployment package excluding unnecessary files
2. Deploys the package to Azure App Service using the Azure CLI
3. Tests the API to verify the deployment

#### Frontend Deployment
1. Builds the frontend application
2. Deploys the built files to Azure Static Web Apps using the Static Web Apps CLI
3. Configures the correct MIME types and routing rules

## Manual Deployment (Alternative)

If you prefer to run the deployment steps manually, you can follow these instructions:

### Backend Manual Deployment

1. **Create a deployment package**:
   ```bash
   # Navigate to the repository root
   cd /path/to/project

   # Create a clean deployment package
   cd backend && zip -r ../azure-backend-deployment.zip . -x "*.pyc" -x "__pycache__/*" -x "venv/*" && cd ..
   ```

2. **Deploy to Azure App Service**:
   ```bash
   # Deploy the package using the Azure CLI
   az webapp deploy --resource-group yang2 --name yang2-api --src-path azure-backend-deployment.zip --type zip
   ```

### Frontend Manual Deployment

1. **Build the frontend**:
   ```bash
   # Navigate to the frontend directory
   cd frontend

   # Build the application
   npm run build
   ```

2. **Deploy to Azure Static Web Apps**:
   ```bash
   # Deploy using the Static Web Apps CLI
   npx @azure/static-web-apps-cli deploy dist --deployment-token YOUR_DEPLOYMENT_TOKEN --env production
   ```

## Environment Configuration

### Backend Environment Variables

The backend requires the following environment variables to be set in the Azure App Service:

- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint (e.g., "https://yang2-openai.openai.azure.com/")
- `AZURE_OPENAI_DEPLOYMENT_NAME`: The deployment name in Azure OpenAI (e.g., "gpt-4o-mini")

You can configure these in the Azure Portal:
1. Go to the Azure Portal
2. Navigate to your App Service (yang2-api)
3. Go to Settings > Configuration
4. Update the Application settings as needed

### Frontend Environment Variables

The frontend configuration is managed through the `.env.production` file.

## Troubleshooting

### Backend Deployment Issues

If the backend deployment fails:

1. Check the Azure App Service logs:
   ```bash
   az webapp log tail --name yang2-api --resource-group yang2
   ```

2. Try restarting the App Service:
   ```bash
   az webapp restart --name yang2-api --resource-group yang2
   ```

3. Verify that your `requirements.txt` file has all necessary dependencies with compatible versions.

### Frontend Deployment Issues

1. Make sure the Static Web Apps CLI is correctly installed:
   ```bash
   npm install -g @azure/static-web-apps-cli
   ```

2. Verify that your environment variables in `.env.production` are correctly set
3. Check that your deployment token is valid and has not expired 