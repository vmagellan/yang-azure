import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get environment variables
api_key = os.getenv("AZURE_OPENAI_API_KEY")
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/")

if not api_key or not endpoint:
    print("ERROR: Missing required environment variables")
    print("Please make sure you have created a .env file with the following variables:")
    print("AZURE_OPENAI_API_KEY=your_api_key_here")
    print("AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/")
    exit(1)

# API version
api_version = "2024-02-15-preview"  # Using a recent version that supports model deployments

# URL for deployments
deployments_url = f"{endpoint}/openai/deployments?api-version={api_version}"

# Set up headers
headers = {
    "api-key": api_key,
    "Content-Type": "application/json"
}

print(f"Checking deployments at: {endpoint}")
print(f"Using API Key: {api_key[:3]}...{api_key[-3:]}")
print("-" * 50)

try:
    # Make the request
    response = requests.get(deployments_url, headers=headers)
    response.raise_for_status()  # Raise exception if request failed
    
    # Parse the response
    data = response.json()
    
    if "data" in data and len(data["data"]) > 0:
        print(f"Found {len(data['data'])} deployments:")
        print("\nDeployment Name\t\tModel")
        print("-" * 40)
        for deployment in data["data"]:
            print(f"{deployment['id']}\t\t{deployment['model']}")
        
        print("\n\nIMPORTANT: Use the 'Deployment Name' in your .env file, not the 'Model'.")
        print("Example .env entry:")
        if len(data["data"]) > 0:
            example_deployment = data["data"][0]["id"]
            print(f"AZURE_OPENAI_DEPLOYMENT_NAME={example_deployment}")
    else:
        print("No deployments found. You need to create a deployment in the Azure OpenAI Studio.")
        print("Instructions:")
        print("1. Go to Azure Portal and navigate to your Azure OpenAI resource")
        print("2. Click on 'Model Deployments' or go to Azure OpenAI Studio")
        print("3. Create a new deployment of your desired model (e.g., gpt-4o-mini)")
        print("4. Use the deployment name you provide in your .env file")
    
except Exception as e:
    print(f"Error occurred: {str(e)}")
    print("\nTroubleshooting tips:")
    print("1. Check if your API key is correct")
    print("2. Make sure the endpoint URL is correct")
    print("3. Verify that your Azure subscription has access to Azure OpenAI") 