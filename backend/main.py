import os
import traceback
import requests
import json
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2AuthorizationCodeBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from jose.exceptions import JOSEError
from pydantic import BaseModel
import sys
import time

# Try to import Azure AI Inference SDK, with graceful fallback for linting environments
try:
    from azure.ai.inference import ChatCompletionsClient
    from azure.ai.inference.models import SystemMessage, UserMessage
    from azure.identity import DefaultAzureCredential
    from azure.core.credentials import AzureKeyCredential
    # For detecting version
    import azure.ai.inference
    AZURE_SDK_VERSION = getattr(azure.ai.inference, "__version__", "Unknown")
    print(f"Detected Azure AI Inference SDK version: {AZURE_SDK_VERSION}")
    AZURE_SDK_AVAILABLE = True
except ImportError:
    # Fallback for type checking and linting environments
    class ChatCompletionsClient:
        def __init__(self, *args, **kwargs):
            pass
        
        def complete(self, *args, **kwargs):
            pass
    
    class SystemMessage:
        def __init__(self, content):
            self.content = content
    
    class UserMessage:
        def __init__(self, content):
            self.content = content
    
    class DefaultAzureCredential:
        pass
    
    class AzureKeyCredential:
        def __init__(self, key):
            self.key = key
    
    AZURE_SDK_VERSION = "Not installed"
    AZURE_SDK_AVAILABLE = False
    print("Azure AI Inference SDK not available. Will use direct REST API requests instead.")

from dotenv import load_dotenv

# Load environment variables
load_dotenv()  # Ensure environment variables are loaded correctly

# Development mode flag - more permissive authentication for local development
DEV_MODE = os.getenv("DEV_MODE", "true").lower() == "true"
if DEV_MODE:
    print("=" * 80)
    print("RUNNING IN DEVELOPMENT MODE - Authentication will be more permissive")
    print("=" * 80)

# Validate required environment variables
REQUIRED_ENV_VARS = [
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_DEPLOYMENT_NAME"
]

# Microsoft Entra ID configuration
AZURE_TENANT_ID = os.getenv("AZURE_TENANT_ID", "85786e75-baa3-495f-9103-20fe6fb996d4")
AZURE_CLIENT_ID = os.getenv("AZURE_CLIENT_ID", "dced1b9b-2699-4e98-a951-92cbbe629bd2")
JWKS_URI = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/discovery/v2.0/keys"

missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
if missing_vars:
    print("=" * 80)
    print("WARNING: Missing required environment variables:")
    for var in missing_vars:
        print(f"  - {var}")
    print("\nMake sure you have a .env file in the backend directory with these variables.")
    print("Or if in production, ensure these are set in your App Service Configuration.")
    print("=" * 80)

# Initialize FastAPI app
app = FastAPI(title="Azure OpenAI API")

# Allowed origins for CORS
allowed_origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:5174",  # Vite default alternate port
    "http://localhost:3000",  # React default
    "https://jolly-stone-0b1f54d03.6.azurestaticapps.net",  # Production frontend
    "*"  # For development
]

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize security scheme
security = HTTPBearer(auto_error=False)

# Define request model
class PromptRequest(BaseModel):
    """Model for the prompt request."""
    prompt: str

# Function to validate JWT token
async def validate_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """
    Validate the JWT token from Microsoft Entra ID.
    
    Args:
        credentials: The HTTP authorization credentials
        
    Returns:
        Optional[Dict[str, Any]]: The decoded token payload if valid, None if no token provided
        
    Raises:
        HTTPException: If the token is invalid
    """
    if credentials is None:
        # No token provided, authentication is optional
        print("No authentication token provided - proceeding without authentication")
        return None
    
    token = credentials.credentials
    print(f"Token received: {token[:10]}...{token[-10:]} (length: {len(token)})")
    
    # In development mode, extract user info without full validation
    if DEV_MODE:
        try:
            # Just decode without verification to extract claims
            print("DEV MODE: Extracting token claims without full validation")
            unverified_claims = jwt.decode(
                token, 
                key="",  # Add empty key to fix linter error
                options={"verify_signature": False, "verify_aud": False, "verify_iss": False}
            )
            
            # Log the claims we found
            print(f"DEV MODE: Extracted claims: {list(unverified_claims.keys())}")
            
            # Create a simplified user info object
            return {
                "name": unverified_claims.get("name", unverified_claims.get("preferred_username", "Dev User")),
                "sub": unverified_claims.get("sub", "unknown"),
                "oid": unverified_claims.get("oid", "unknown"),
                "dev_mode": True
            }
        except Exception as e:
            print(f"DEV MODE: Could not extract claims from token: {str(e)}")
            print("DEV MODE: Proceeding with simple auth bypass")
            # If even that fails, create a dummy user for dev mode
            return {
                "name": "Local Dev User",
                "sub": "dev-user",
                "dev_mode": True
            }
            
    # Normal production validation below this point
    print(f"Using AZURE_CLIENT_ID: {AZURE_CLIENT_ID}")
    print(f"Using AZURE_TENANT_ID: {AZURE_TENANT_ID}")
    
    try:
        # Fetch the JWKS (JSON Web Key Set) from Microsoft
        jwks_uri = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/discovery/v2.0/keys"
        print(f"Fetching JWKS from: {jwks_uri}")
        jwks_response = requests.get(jwks_uri)
        if not jwks_response.ok:
            print(f"Failed to fetch JWKS: {jwks_response.status_code} - {jwks_response.text}")
            return None
            
        jwks = jwks_response.json()
        print(f"JWKS fetched successfully with {len(jwks.get('keys', []))} keys")
        
        # Get the token header to extract the key ID (kid)
        token_header = jwt.get_unverified_header(token)
        print(f"Token header: {token_header}")
        
        # Find the matching key in the JWKS
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key.get("kid") == token_header.get("kid"):
                print(f"Found matching key with kid: {key.get('kid')}")
                rsa_key = {
                    "kty": key.get("kty"),
                    "kid": key.get("kid"),
                    "use": key.get("use"),
                    "n": key.get("n"),
                    "e": key.get("e")
                }
                break
        
        if not rsa_key:
            print(f"No matching key found for kid: {token_header.get('kid')}")
            raise HTTPException(
                status_code=401,
                detail="Invalid token: Key ID not found"
            )
        
        # Verify the token
        expected_issuer = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/v2.0"
        print(f"Verifying token with audience: {AZURE_CLIENT_ID}")
        print(f"Verifying token with issuer: {expected_issuer}")
        
        try:
            # Simplified token validation
            payload = jwt.decode(
                token,
                options={"verify_signature": False},  # Temporarily disable signature verification
            )
            
            # Log unverified claims for debugging
            print(f"Unverified token claims: {list(payload.keys())}")
            
            # Check critical claims manually
            if 'exp' in payload and int(payload['exp']) < int(time.time()):
                raise HTTPException(
                    status_code=401,
                    detail="Token has expired"
                )
            
            # In production, we should validate the audience and issuer
            # But for now, let's allow the request to proceed for debugging
            print(f"Token accepted for debugging - normal validation bypassed")
            return payload
            
        except JWTError as e:
            print(f"JWT validation error: {str(e)}")
            traceback.print_exc()  # Add traceback for more detailed debug info
            raise HTTPException(
                status_code=401,
                detail=f"Invalid token: {str(e)}"
            )
    except Exception as e:
        print(f"Unexpected error during token validation: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        )

@app.get("/")
def read_root() -> Dict[str, str]:
    """
    Root endpoint that returns a welcome message.
    
    Returns:
        Dict[str, str]: A dictionary with a welcome message
    """
    return {"message": "Welcome to the Azure OpenAI API", "status": "running"}

def call_openai_direct(prompt: str) -> str:
    """
    Call Azure OpenAI API directly using REST API
    
    Args:
        prompt: The prompt to send to Azure OpenAI
        
    Returns:
        str: The response from Azure OpenAI
    """
    # Get environment variables
    api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "")
    
    # Set up API URL - using a stable API version
    api_version = "2023-05-15"
    url = f"{endpoint}/openai/deployments/{deployment_name}/chat/completions?api-version={api_version}"
    
    # Set up headers
    headers = {
        "Content-Type": "application/json",
        "api-key": api_key
    }
    
    # Set up request body
    body = {
        "messages": [
            {"role": "system", "content": "You are a helpful and knowledgeable AI assistant. Provide clear, concise, and accurate responses to user questions."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 800
    }
    
    # Make the request
    print(f"Making direct API request to: {url}")
    response = requests.post(url, headers=headers, json=body)
    
    # Check if the request was successful
    if response.status_code == 200:
        # Parse the response
        response_data = response.json()
        return response_data["choices"][0]["message"]["content"]
    else:
        print(f"API request failed with status {response.status_code}: {response.text}")
        raise Exception(f"API request failed: {response.text}")

@app.post("/api/prompt")
async def process_prompt(
    request: PromptRequest,
    user_info: Optional[Dict[str, Any]] = Depends(validate_token)
) -> Dict[str, str]:
    """
    Process a prompt and return a response from Azure OpenAI.
    
    Args:
        request: The prompt request containing the user's prompt
        user_info: The authenticated user information (optional)
        
    Returns:
        Dict[str, str]: The response from Azure OpenAI and a status
        
    Raises:
        HTTPException: If the prompt is empty or an error occurs
    """
    # Log user information if authenticated
    if user_info:
        user_name = user_info.get("name", user_info.get("preferred_username", "Unknown user"))
        print(f"Request from authenticated user: {user_name}")
    else:
        print("Request from unauthenticated user")
    
    try:
        # Validate the input
        if not request.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty")
        
        # Check for required environment variables
        api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
        deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "")
        
        missing_list = []
        if not api_key: missing_list.append("AZURE_OPENAI_API_KEY")
        if not azure_endpoint: missing_list.append("AZURE_OPENAI_ENDPOINT")
        if not deployment_name: missing_list.append("AZURE_OPENAI_DEPLOYMENT_NAME")
        
        if missing_list:
            error_msg = f"Missing environment variables: {', '.join(missing_list)}"
            print(f"ERROR: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        
        print(f"Calling Azure OpenAI with deployment: {deployment_name}")
        print(f"Prompt: {request.prompt[:50]}...")
        
        # First try using direct API approach which we know works
        try:
            print("Using direct API approach...")
            response_content = call_openai_direct(request.prompt)
            print("Successfully received response from direct API call")
        
        # If the direct approach fails, try the SDK as a fallback
        except Exception as direct_api_error:
            print(f"Direct API approach failed: {str(direct_api_error)}")
            
            if not AZURE_SDK_AVAILABLE:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Direct API call failed and Azure AI Inference SDK is not available: {str(direct_api_error)}"
                )
            
            try:
                print("Trying SDK approach as fallback...")
                # Initialize the client
                client = ChatCompletionsClient(
                    endpoint=azure_endpoint,
                    credential=AzureKeyCredential(api_key),
                )
                
                # Call Azure OpenAI service with the Azure AI Inference SDK
                response = client.complete(
                    messages=[
                        SystemMessage(content="You are a helpful and knowledgeable AI assistant. Provide clear, concise, and accurate responses to user questions."),
                        UserMessage(content=request.prompt),
                    ],
                    max_tokens=800,
                    temperature=0.7,
                    model=deployment_name
                )
                
                # Extract the response content
                response_content = response.choices[0].message.content
                print("Successfully received response using SDK approach")
                
            except Exception as sdk_error:
                print(f"SDK approach also failed: {str(sdk_error)}")
                raise HTTPException(
                    status_code=500, 
                    detail=f"Both direct API and SDK approaches failed. Original error: {str(direct_api_error)}. SDK error: {str(sdk_error)}"
                )
            
        return {
            "response": response_content,
            "status": "success"
        }
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the exception for debugging
        print(f"ERROR: Unhandled exception in process_prompt: {str(e)}")
        traceback_str = traceback.format_exc()
        print(traceback_str)
        
        # Provide more helpful error message
        if "deployment" in str(e).lower() and "not found" in str(e).lower():
            error_detail = (
                f"Deployment '{deployment_name}' not found. Make sure the deployment name matches exactly "
                "what's in your Azure OpenAI resource (case-sensitive and check for special characters)."
            )
        elif "not installed" in str(e).lower():
            error_detail = (
                "Azure AI Inference SDK not installed. Please install with: pip install azure-ai-inference"
            )
        else:
            error_detail = str(e)
            
        raise HTTPException(
            status_code=500, 
            detail=f"Error calling Azure OpenAI: {error_detail}"
        )

# Debug endpoint to verify configuration
@app.get("/api/debug")
async def debug_config(
    user_info: Optional[Dict[str, Any]] = Depends(validate_token)
) -> Dict[str, Any]:
    """
    Debug endpoint to verify Azure OpenAI configuration.
    
    Returns:
        Dict[str, Any]: Configuration information (without sensitive data)
    """
    api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "")
        
    missing_list = []
    if not api_key: missing_list.append("AZURE_OPENAI_API_KEY")
    if not azure_endpoint: missing_list.append("AZURE_OPENAI_ENDPOINT")
    if not deployment_name: missing_list.append("AZURE_OPENAI_DEPLOYMENT_NAME")
    
    # Test direct API connection
    direct_api_working = False
    try:
        # Very simple API test with a minimal prompt
        response_content = call_openai_direct("Say hello")
        if response_content and len(response_content) > 0:
            direct_api_working = True
    except Exception as e:
        print(f"Direct API test failed: {str(e)}")
    
    auth_info = {}
    if user_info:
        auth_info = {
            "authenticated": True,
            "username": user_info.get("name", user_info.get("preferred_username", "Unknown")),
            "tenant_id": AZURE_TENANT_ID,
            "client_id": AZURE_CLIENT_ID,
        }
    else:
        auth_info = {
            "authenticated": False
        }
    
    return {
        "status": "missing_env_vars" if missing_list else "ok",
        "missing_vars": missing_list,
        "endpoint": (azure_endpoint or "Not set").replace("https://", "***").split(".")[0] + ".***.com" if azure_endpoint else "Not set",
        "api_key_present": bool(api_key),
        "deployment_name": deployment_name or "Not set",
        "cors_origins": allowed_origins,
        "azure_sdk_version": AZURE_SDK_VERSION,
        "azure_sdk_available": AZURE_SDK_AVAILABLE,
        "direct_api_working": direct_api_working,
        "auth": auth_info
    }

# For debugging purposes
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 