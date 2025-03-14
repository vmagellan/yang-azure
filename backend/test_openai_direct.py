import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get environment variables
api_key = os.getenv("AZURE_OPENAI_API_KEY")
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

print(f"Testing Azure OpenAI Direct API")
print(f"Endpoint: {endpoint}")
print(f"Deployment: {deployment_name}")
print(f"API Key: {api_key[:3]}...{api_key[-3:]}")
print("-" * 50)

if not api_key or not endpoint or not deployment_name:
    print("Missing required environment variables.")
    print("Please check your .env file.")
    exit(1)

# Set up the API URL - using a simpler API version
api_version = "2023-05-15"
url = f"{endpoint}/openai/deployments/{deployment_name}/chat/completions?api-version={api_version}"

# Set up the request headers
headers = {
    "Content-Type": "application/json",
    "api-key": api_key
}

# Set up the request body
body = {
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What are the top attractions to see in Paris?"}
    ],
    "temperature": 0.7,
    "max_tokens": 800
}

print(f"Making request to: {url}")

try:
    # Make the API call
    response = requests.post(url, headers=headers, json=body)
    
    # Check if the request was successful
    if response.status_code == 200:
        # Parse the response
        response_data = response.json()
        content = response_data["choices"][0]["message"]["content"]
        
        print("\n--- SUCCESS: Response from Azure OpenAI ---")
        print(content)
        print("-------------------------------------------")
    else:
        print(f"\nError: {response.status_code}")
        print(response.text)
        
        if response.status_code == 404:
            print("\nTROUBLESHOOTING: 404 Not Found")
            print("This usually means your deployment name is incorrect.")
            print("In Azure OpenAI Studio, look for your deployments and use the exact deployment name.")
            print("Remember: use the deployment name, NOT the model name.")
        
        elif response.status_code == 401:
            print("\nTROUBLESHOOTING: 401 Unauthorized")
            print("This usually means your API key is incorrect or expired.")
        
        print("\nStep-by-step debugging:")
        print("1. In the Azure Portal, navigate to your Azure OpenAI resource")
        print("2. Go to 'Keys and Endpoint' and verify your endpoint and key")
        print("3. Go to Azure OpenAI Studio and check your deployment name") 
        
except Exception as e:
    print(f"An error occurred: {str(e)}") 