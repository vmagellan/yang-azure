import os
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get environment variables
api_key = os.getenv("AZURE_OPENAI_API_KEY")
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

print("Starting Azure OpenAI API test with API Key authentication...")
print(f"Endpoint: {endpoint}")
print(f"Deployment Name: {deployment_name}")
print(f"API Key present: {'Yes' if api_key else 'No'}")

if not api_key or not endpoint or not deployment_name:
    print("\nERROR: Missing required environment variables")
    print("Please make sure you have created a .env file with the following variables:")
    print("AZURE_OPENAI_API_KEY=your_api_key_here")
    print("AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/")
    print("AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name")
    exit(1)

try:
    # Initialize the client with API key authentication
    print("Creating ChatCompletionsClient with API key authentication...")
    client = ChatCompletionsClient(
        endpoint=endpoint,
        credential=AzureKeyCredential(api_key),
    )
    
    # Send the request
    print("Sending request to Azure OpenAI...")
    response = client.complete(
        messages=[
            SystemMessage(content="You are a helpful assistant."),
            UserMessage(content="I am going to Paris, what should I see?"),
        ],
        max_tokens=4096,
        temperature=1.0,
        top_p=1.0,
        model=deployment_name
    )
    
    # Print the response
    print("\nResponse from Azure OpenAI:")
    print("-------------------------")
    print(response.choices[0].message.content)
    print("-------------------------")
    print("Test completed successfully!")
    
except Exception as e:
    print(f"\nError occurred: {str(e)}")
    print("\nTroubleshooting tips:")
    print("1. Check if your API key is correct and not expired")
    print("2. Make sure the endpoint URL is correct")
    print("3. Verify that the deployment name is exactly as shown in Azure OpenAI Studio")
    print("4. Ensure you're using the deployment name (not the model name)")
    print("   For example: 'my-gpt4mini-deployment' (deployment name) not 'gpt-4o-mini' (model name)") 