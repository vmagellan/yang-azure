# Troubleshooting Azure OpenAI API Issues

This guide addresses common issues when working with the Azure OpenAI API in this application.

## Common Error: "'function' object has no attribute 'create'"

This error typically occurs due to compatibility issues between your installed `openai` package version and the code in the application.

### Quick Fix:

Run the provided update script in the backend directory:

```bash
cd backend
chmod +x update_openai.sh
./update_openai.sh
```

Or manually update the OpenAI package:

```bash
pip install openai>=1.6.0
```

After updating the package, restart your backend server:

```bash
uvicorn main:app --reload
```

### Why This Error Occurs:

The OpenAI Python SDK underwent significant changes in version 1.0.0, which changed the client API structure:

- **Old pattern (v0.x)**: Used global methods like `openai.ChatCompletion.create()`
- **New pattern (v1.x)**: Uses client instances and namespaces like `client.chat.completions.create()`

Our application now supports both patterns through internal fallback mechanisms, but having the latest SDK installed is recommended.

## Deployment Name Issues

If you see errors related to "DeploymentNotFound", check these common issues:

1. **Exact Naming Match**: 
   - Ensure `AZURE_OPENAI_DEPLOYMENT_NAME` matches exactly what's in your Azure OpenAI resource.
   - The name is case-sensitive and should include any hyphens or special characters.
   
2. **Deployment vs. Model**:
   - Use the deployment name (e.g., "my-gpt4-deployment"), not the model name (e.g., "gpt-4").
   - In Azure OpenAI, you create deployments of models, and refer to those deployments in API calls.

3. **Special Characters**:
   - Some deployment names with special characters may cause issues.
   - Try using alphanumeric characters and hyphens only.

## Configuration Issues

If you see errors about missing environment variables:

1. **Check your .env file**:
   - Make sure you've renamed `.env.example` to `.env` in the backend directory.
   - Verify all required variables are set with correct values.

2. **Required Environment Variables**:
   ```
   AZURE_OPENAI_API_KEY=your_api_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_VERSION=2024-10-21
   AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
   ```

3. **Run the debug endpoint**:
   - While the backend is running, visit `http://localhost:8000/api/debug` in your browser.
   - This will show your current configuration (without exposing sensitive data).

## API Connection Issues

If you're having trouble connecting to Azure OpenAI:

1. **Check your Azure OpenAI resource**:
   - Verify your resource is active in the Azure portal.
   - Make sure you're using the correct endpoint URL.

2. **API Key Issues**:
   - Ensure your API key is valid and not expired.
   - Check for extra spaces or special characters inadvertently included in your key.

3. **Network Problems**:
   - If running in a corporate environment, check if there are any firewall restrictions.

## Deployment-Specific Issues

If you're getting errors related to your model deployment:

1. **Invalid Deployment Name**:
   - Verify the deployment exists in your Azure OpenAI resource.
   - Deployment names are case-sensitive.

2. **Model Quotas**:
   - Check if you've exceeded your quota for the model.

3. **Request Parameters**:
   - Some errors may occur if request parameters (like max_tokens) are incompatible with your model.

## Package Version Compatibility

This application has been tested with the following configurations:

- openai >= 1.6.0
- Python 3.9+
- FastAPI 0.104.1

If you continue experiencing issues, please check the backend logs for more detailed error messages, which will provide specific information about what's going wrong. 