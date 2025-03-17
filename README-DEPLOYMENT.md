# Deployment Guide

This document outlines the deployment process for both the frontend and backend components of the application.

## Frontend Deployment

The frontend is automatically deployed via GitHub Actions whenever changes are pushed to the `main` branch that affect the frontend code.

### How it Works

1. The GitHub Actions workflow is defined in `.github/workflows/azure-static-web-apps-jolly-stone-0b1f54d03.yml`
2. When code is pushed to the `main` branch, the workflow automatically builds and deploys the frontend to Azure Static Web Apps
3. The deployment is accessible at: https://jolly-stone-0b1f54d03.6.azurestaticapps.net

### Manual Trigger

If you need to manually trigger a deployment:

1. Make your changes to the frontend code
2. Commit and push to the main branch:
   ```
   git add frontend/
   git commit -m "Your commit message"
   git push
   ```

## Backend Deployment

The backend is deployed manually using the Azure CLI. This approach was chosen because it's more reliable than the GitHub Actions workflow for the backend.

### Prerequisites

- Azure CLI installed and logged in
- Access to the Azure subscription

### Deployment Steps

1. **Create a deployment package**:
   ```bash
   # Navigate to the repository root
   cd /path/to/project

   # Create a clean deployment package
   cd backend && zip -r ../azure-backend-deployment.zip . -x "*.pyc" -x "__pycache__/*" -x "venv/*" && cd ..
   ```

2. **Deploy to Azure App Service**:
   ```bash
   # Deploy the package using the newer az webapp deploy command
   az webapp deploy --resource-group yang2 --name yang2-api --src-path azure-backend-deployment.zip --type zip
   ```

3. **Verify the deployment**:
   ```bash
   # Check if the API is responding
   curl https://yang2-api.azurewebsites.net/
   
   # Test the API with a prompt
   curl -s https://yang2-api.azurewebsites.net/api/prompt -H "Content-Type: application/json" -d '{"prompt":"What are popular tourist attractions in Paris?"}'
   ```

### Environment Configuration

The backend requires the following environment variables to be set in the Azure App Service:

- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint (e.g., "https://yang2-openai.openai.azure.com/")
- `AZURE_OPENAI_DEPLOYMENT_NAME`: The deployment name in Azure OpenAI (e.g., "gpt-4o-mini")

These are set automatically during deployment, but you can also configure them manually in the Azure Portal:

1. Go to the Azure Portal
2. Navigate to your App Service (yang2-api)
3. Go to Settings > Configuration
4. Update the Application settings as needed

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

1. Check the GitHub Actions workflow runs in your repository
2. Verify that your environment variables in `.env.production` are correctly set 