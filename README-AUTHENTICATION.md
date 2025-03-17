# Microsoft Entra Authentication Setup

This guide provides step-by-step instructions for implementing Microsoft Entra (formerly Azure AD B2C) authentication in this application.

## 1. Create App Registration in Microsoft Entra

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Microsoft Entra ID" (or "Azure Active Directory")
3. Select "App registrations" → "New registration"
4. Enter the following details:
   - **Name**: Yang-Azure-App
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: 
     - Platform: Single-page application (SPA)
     - URL: `https://jolly-stone-0b1f54d03.6.azurestaticapps.net/`
     - Add a second redirect URI for local development: `http://localhost:5173/`
5. Click "Register"
6. Once created, note the following values:
   - **Application (client) ID**
   - **Directory (tenant) ID**

## 2. Configure Authentication Settings

1. In the app registration, navigate to "Authentication"
2. Under "Implicit grant and hybrid flows", check:
   - Access tokens
   - ID tokens
3. Under "Advanced settings", set "Logout URL" to:
   - `https://jolly-stone-0b1f54d03.6.azurestaticapps.net/`
4. Save the changes

## 3. Set API Permissions

1. Go to "API permissions"
2. Add the following permissions:
   - Microsoft Graph: User.Read (delegated)
3. Click "Grant admin consent" for your directory

## 4. Frontend Implementation

### Install Required Packages

```bash
cd frontend
npm install @azure/msal-browser @azure/msal-react
```

### Create Authentication Configuration

Create a new file at `frontend/src/authConfig.ts`:

```typescript
export const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID", // Replace with your App Registration Client ID
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID", // Replace with your Tenant ID
    redirectUri: window.location.origin, // Will use the current URL as redirect URL
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// Scopes for the token request
export const loginRequest = {
  scopes: ["User.Read"]
};

// Graph API endpoint for user info
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
```

### Modify Main React Entry Point

Update `frontend/src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import App from './App.tsx'
import './index.css'
import { msalConfig } from './authConfig';

// Initialize MSAL
const msalInstance = new PublicClientApplication(msalConfig);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>,
)
```

### Update App Component to Use Authentication

Modify `frontend/src/App.tsx` to include login functionality:

```tsx
import { useState } from 'react'
import { useMsal, useIsAuthenticated, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import './App.css'

function App() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error("Login failed", e);
    });
  };

  const handleLogout = () => {
    instance.logout();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      // Get access token
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account: instance.getAllAccounts()[0]
      });
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenResponse.accessToken}`
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error calling API:', error);
      setResponse('Error getting response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Azure OpenAI Integration</h1>
        {isAuthenticated ? (
          <button onClick={handleLogout}>Sign Out</button>
        ) : null}
      </header>

      <UnauthenticatedTemplate>
        <div className="login-container">
          <h2>Please sign in to use the application</h2>
          <button onClick={handleLogin}>Sign In</button>
        </div>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <main>
          <form onSubmit={handleSubmit}>
            <label htmlFor="prompt">Ask a question:</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your question here..."
              rows={4}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Getting response...' : 'Submit'}
            </button>
          </form>

          {response && (
            <div className="response">
              <h2>Response:</h2>
              <p>{response}</p>
            </div>
          )}
        </main>
      </AuthenticatedTemplate>
    </div>
  );
}

export default App;
```

## 5. Backend Implementation (FastAPI)

### Install Required Packages

```bash
cd backend
pip install python-jose[cryptography] python-multipart
```

Update your `requirements.txt`:

```
fastapi
uvicorn
azure-ai-inference>=1.0.0b9
requests
python-dotenv
gunicorn
python-jose[cryptography]
python-multipart
```

### Add Token Validation to Backend

Modify `backend/main.py` to include authentication:

```python
# Add these imports at the top
from fastapi.security import OAuth2AuthorizationCodeBearer
from jose import jwt
from jose.exceptions import JOSEError
import json
from typing import Optional

# Add these after other environment variables
AZURE_TENANT_ID = os.getenv("AZURE_TENANT_ID", "")
AZURE_CLIENT_ID = os.getenv("AZURE_CLIENT_ID", "")
JWKS_URI = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/discovery/v2.0/keys"

# Add this to the list of required environment variables
REQUIRED_ENV_VARS = [
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_DEPLOYMENT_NAME",
    "AZURE_TENANT_ID",  # Add this
    "AZURE_CLIENT_ID",  # Add this
]

# Initialize OAuth2 scheme
oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/authorize",
    tokenUrl=f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/token",
    scopes={"User.Read": "User.Read"}
)

# Add a function to validate tokens
async def get_current_user(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    """
    Validate the access token and return the user information.
    
    Args:
        token: The OAuth2 token from the request
        
    Returns:
        The decoded token payload if valid
        
    Raises:
        HTTPException: If the token is invalid
    """
    try:
        # For Microsoft Entra ID tokens, we need to validate using JWKS
        # In a production environment, you should cache the JWKS
        jwks_response = requests.get(JWKS_URI)
        jwks = jwks_response.json()
        
        # Decode the token header to get the key ID (kid)
        header = jwt.get_unverified_header(token)
        
        # Find the matching key in the JWKS
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        
        if rsa_key:
            # Verify and decode the token
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=AZURE_CLIENT_ID,
                issuer=f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/v2.0"
            )
            return payload
        
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    except JOSEError as e:
        print(f"Token validation error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print(f"Unexpected error during token validation: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Modify your prompt endpoint to require authentication
@app.post("/api/prompt")
async def process_prompt(
    request: PromptRequest,
    user: dict = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Process a prompt and return a response from Azure OpenAI.
    
    Args:
        request: The prompt request containing the user's prompt
        user: The authenticated user information
        
    Returns:
        Dict[str, str]: The response from Azure OpenAI and a status
        
    Raises:
        HTTPException: If the prompt is empty or an error occurs
    """
    # Log the authenticated user info
    print(f"Request from authenticated user: {user.get('name', user.get('preferred_username', 'Unknown'))}")
    
    # Rest of your existing function code...
```

## 6. Updating Azure App Service Configuration

Add the necessary environment variables to your Azure App Service:

```bash
az webapp config appsettings set --name yang2-api --resource-group yang2 --settings \
AZURE_TENANT_ID="YOUR_TENANT_ID" \
AZURE_CLIENT_ID="YOUR_CLIENT_ID"
```

## 7. Testing the Authentication Flow

1. Deploy your changes to both frontend and backend
2. Visit the frontend application
3. You should be redirected to the Microsoft sign-in page
4. After signing in, you should be redirected back to your application
5. The application should now be able to make authenticated API calls

## 8. Security Considerations

1. Always use HTTPS for all endpoints
2. Validate tokens properly on the backend
3. Don't expose sensitive information in client-side code
4. Use proper CORS settings to prevent unauthorized domains from making requests
5. Consider using refresh tokens for long-lived sessions

## Next Steps

- Implement role-based access control (RBAC)
- Add user profile information
- Implement token refresh logic
- Add user-specific data storage 