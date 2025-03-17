# Azure AI Inference SDK Troubleshooting Guide

This guide addresses common issues when using the Azure AI Inference SDK for connecting to Azure OpenAI services.

## Common Error: "Azure AI Inference SDK not installed"

This error occurs when the required Azure AI Inference SDK is not installed in your Python environment.

### Quick Fix:

Run the provided update script in the backend directory:

```bash
cd backend
chmod +x update_azure_sdk.sh
./update_azure_sdk.sh
```

Or manually install the required packages:

```bash
pip install "azure-ai-inference>=1.0.0b1" "azure-identity>=1.15.0"
```

After installing the packages, restart your backend server:

```bash
uvicorn main:app --reload
```

## Deployment Name Issues

If you see errors related to "deployment not found" or similar issues:

1. **Correct Deployment Name**: 
   - In Azure OpenAI, you need to use the deployment name, not the model name
   - For example: Use "my-gpt4-deployment" (your deployment name) instead of "gpt-4o-mini" (the model name)

2. **Case Sensitivity**:
   - Deployment names are case-sensitive
   - Make sure it matches exactly what's in your Azure OpenAI resource

3. **Check Azure Portal**:
   - Verify the deployment exists in your Azure OpenAI resource
   - You can find your deployments in the Azure portal under your Azure OpenAI resource → Model Deployments

## Authentication Issues

If you're having trouble authenticating:

1. **API Key**:
   - Make sure your `AZURE_OPENAI_API_KEY` environment variable is set correctly
   - Check for extra spaces or special characters in your key

2. **Endpoint URL**:
   - Ensure your `AZURE_OPENAI_ENDPOINT` has the correct format: `https://your-resource.openai.azure.com/`
   - Double-check the resource name in the URL

3. **Required Environment Variables**:
   - Make sure you have a `.env` file in the backend directory with these variables:
   ```
   AZURE_OPENAI_API_KEY=your_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
   ```

## Checking Your Configuration

While the backend is running, you can check your configuration:

1. Access the debug endpoint: `http://localhost:8000/api/debug`
2. This will show your current configuration (without exposing sensitive data)
3. Ensure all required variables are present and your SDK is installed

## Why We Switched to Azure AI Inference SDK

The Azure AI Inference SDK is Microsoft's official and recommended SDK for working with Azure OpenAI services. It provides:

1. Better compatibility with Azure OpenAI services
2. Simpler authentication methods
3. More consistent API interface
4. Direct support from Microsoft

If you continue experiencing issues, please check the backend logs for more detailed error messages, which will provide specific information about what's going wrong. 