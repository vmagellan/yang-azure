import os
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.identity import DefaultAzureCredential

endpoint = "https://yang2-openai.openai.azure.com/"
model_name = "gpt-4o-mini"

print("Starting Azure OpenAI API test with DefaultAzureCredential...")
print(f"Endpoint: {endpoint}")
print(f"Model: {model_name}")

try:
    # Initialize the authentication credential
    print("Initializing DefaultAzureCredential...")
    credential = DefaultAzureCredential()
    
    # Initialize the client
    print("Creating ChatCompletionsClient...")
    client = ChatCompletionsClient(
        endpoint=endpoint,
        credential=credential,
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
        model=model_name
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
    print("1. Make sure you're logged in with Azure CLI (run 'az login')")
    print("2. Verify the endpoint URL is correct")
    print("3. Ensure the model name is the deployment name in Azure OpenAI") 
    print("4. Check if your Azure account has access to this Azure OpenAI resource") 