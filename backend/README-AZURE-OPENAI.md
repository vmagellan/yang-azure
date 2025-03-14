# Setting Up Azure OpenAI Service

This guide explains how to set up Azure OpenAI Service to work with your backend API.

## Prerequisites

1. Azure account with access to Azure OpenAI Service
2. Permission to create and deploy Azure OpenAI models

## Steps to Set Up Azure OpenAI

### 1. Create an Azure OpenAI Resource

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Search for "Azure OpenAI" in the marketplace
3. Click "Create"
4. Fill in the required details:
   - Subscription: Select your Azure subscription
   - Resource group: Create a new one or use an existing one
   - Region: Select a region where Azure OpenAI is available
   - Name: Choose a unique name for your OpenAI resource
   - Pricing tier: Select your preferred pricing tier
5. Click "Review + create" and then "Create"

### 2. Deploy a Model

1. Navigate to your newly created Azure OpenAI resource
2. Click on "Go to Azure OpenAI Studio"
3. In Azure OpenAI Studio, go to "Deployments"
4. Click "Create new deployment"
5. Select a model (e.g., gpt-35-turbo, gpt-4, etc.)
6. Give your deployment a name (this will be used in the `AZURE_OPENAI_DEPLOYMENT_NAME` environment variable)
7. Set the tokens per minute rate limit as needed
8. Click "Create"

### 3. Get API Keys and Endpoint

1. In your Azure OpenAI resource in Azure Portal, go to the "Keys and Endpoint" section
2. Copy one of the keys (KEY 1 or KEY 2)
3. Copy the endpoint URL

### 4. Update Environment Variables

Update the `.env` file in your backend directory with:

```
AZURE_OPENAI_API_KEY=your_copied_key
AZURE_OPENAI_ENDPOINT=your_copied_endpoint
AZURE_OPENAI_API_VERSION=2023-05-15
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
```

## Using the API

Once you've set up the environment variables, your backend will automatically use Azure OpenAI Service to generate responses when you make requests to the `/api/prompt` endpoint.

## Troubleshooting

- **Authentication Errors**: Make sure your API key and endpoint are correct
- **Model Not Found**: Ensure the deployment name matches exactly what you set in Azure OpenAI Studio
- **API Version Errors**: If you encounter API version errors, check the current supported version in the Azure OpenAI documentation and update the `.env` file accordingly 