import { useState, useEffect } from 'react'
import { useMsal, useIsAuthenticated, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react"
import { InteractionStatus, RedirectRequest } from "@azure/msal-browser"
import { loginRequest } from "./authConfig"
import './App.css'

// API URL from environment variables - automatically switches between local and production
const API_URL = import.meta.env.VITE_API_URL || 'https://yang2-api.azurewebsites.net/api/prompt';
console.log('Using API URL:', API_URL);

// Debug authentication state
function getAuthDebugInfo(msal: any, isAuthenticated: boolean) {
  try {
    return {
      isAuthenticated,
      activeAccount: msal.instance.getActiveAccount() ? 
        {
          name: msal.instance.getActiveAccount()?.name,
          username: msal.instance.getActiveAccount()?.username
        } : null,
      allAccounts: msal.instance.getAllAccounts().length,
      inProgress: msal.inProgress
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Unknown error',
      isAuthenticated
    };
  }
}

function App() {
  const msal = useMsal();
  const { instance, inProgress, accounts } = msal;
  const isAuthenticated = useIsAuthenticated();
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authDebug, setAuthDebug] = useState<any>(null)

  // Get user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      const account = accounts[0];
      setUserName(account.name || account.username || "Authenticated User");
    }
  }, [isAuthenticated, accounts]);

  // Log auth state on changes
  useEffect(() => {
    const debugInfo = getAuthDebugInfo(msal, isAuthenticated);
    console.log("Auth Debug Info:", debugInfo);
    setAuthDebug(debugInfo);
  }, [isAuthenticated, inProgress, accounts, msal]);

  const handleLogin = async () => {
    setAuthError(null);
    
    if (inProgress !== InteractionStatus.None) {
      console.log('Authentication already in progress:', inProgress);
      return;
    }
    
    try {
      console.log("Starting login process...");
      
      // Force SPA redirect authentication instead of trying popup first
      const loginRedirectRequest: RedirectRequest = {
        ...loginRequest,
        prompt: 'select_account',
        redirectStartPage: window.location.href
      };
      
      console.log("Initiating redirect login with:", loginRedirectRequest);
      await instance.loginRedirect(loginRedirectRequest);
    } catch (error: any) {
      console.error("Login failed:", error);
      
      let errorMessage = 'Login failed. ';
      
      // Add specific message for SPA configuration error
      if (error.errorCode === "cross_origin_auth_error" || 
          (error.message && error.message.includes("Cross-origin token redemption"))) {
        errorMessage += "This appears to be an Azure AD configuration issue. " +
          "The app registration must be configured as a Single-Page Application (SPA). ";
      }
      
      errorMessage += error.message || 'Unknown error';
      setAuthError(errorMessage);
    }
  };

  const handleLogout = () => {
    instance.logout({
      postLogoutRedirectUri: window.location.origin
    });
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResponse('')
    setSubmitted(true)
    setError(null)

    try {
      // Get access token if authenticated
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      if (isAuthenticated) {
        try {
          console.log("Attempting to acquire token silently...");
          
          // Get access token silently
          const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0] || undefined
          });
          
          // Add the token to the headers
          headers['Authorization'] = `Bearer ${tokenResponse.accessToken}`;
          console.log("Token acquired successfully");
        } catch (tokenError) {
          console.error('Error acquiring token silently:', tokenError);
          
          // Fall back to interactive login if silent token acquisition fails
          try {
            console.log("Falling back to interactive token acquisition...");
            // acquireTokenRedirect doesn't return a token directly - it triggers a redirect
            // This won't actually reach the line below because of the redirect
            await instance.acquireTokenRedirect(loginRequest);
            // This code will not execute due to redirect
            console.log("Redirect initiated for token acquisition");
          } catch (interactiveError) {
            console.error('Error during interactive login:', interactiveError);
            throw new Error('Authentication failed. Please try logging in again.');
          }
        }
      } else {
        console.log("User not authenticated, proceeding without token");
      }
      
      // Make the actual API call to our backend
      console.log("Calling API:", API_URL);
      console.log("Request headers:", JSON.stringify(headers));
      console.log("Request body:", JSON.stringify({ prompt }));
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt })
      })
      
      console.log("API response status:", response.status, response.statusText);
      console.log("API response headers:", JSON.stringify(Object.fromEntries([...response.headers.entries()])));
      
      if (!response.ok) {
        // Try to get the detailed error message from the response
        let errorMessage = `Server responded with status: ${response.status}`;
        try {
          const errorResponse = await response.json();
          console.log("API error response:", errorResponse);
          if (errorResponse.detail) {
            errorMessage = `Error: ${errorResponse.detail}`;
          }
        } catch (e) {
          // If we can't parse the JSON, just use the status message
          console.log("Failed to parse error response:", e);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json()
      console.log("API response data:", data);
      setResponse(data.response)
    } catch (error) {
      console.error('Error fetching response:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Check if API is working by calling the debug endpoint
      try {
        const debugResponse = await fetch(API_URL.replace('/prompt', '/debug'));
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('API debug information:', debugData);
        }
      } catch (debugError) {
        console.error('Could not connect to debug endpoint:', debugError);
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Azure OpenAI Assistant</h1>
        {isAuthenticated ? (
          <div className="user-info">
            <span>Welcome, {userName || 'User'}</span>
            <button onClick={handleLogout} className="logout-button">
              Sign Out
            </button>
          </div>
        ) : null}
      </header>
      
      <UnauthenticatedTemplate>
        <div className="login-container">
          <h2>Please sign in to use the application</h2>
          <p>Authentication is required to access the AI assistant.</p>
          
          {authError && (
            <div className="auth-error">
              <p>{authError}</p>
              <p>Please try again or contact support.</p>
            </div>
          )}
          
          <button 
            onClick={handleLogin} 
            className="login-button"
            disabled={inProgress !== InteractionStatus.None}
          >
            {inProgress !== InteractionStatus.None ? 'Signing in...' : 'Sign In with Microsoft'}
          </button>
          
          <div className="login-status">
            {inProgress !== InteractionStatus.None && 
              <p>Authentication in progress: {inProgress}</p>
            }
            
            {/* Debug information - can be removed in production */}
            {authDebug && (
              <div className="auth-debug" style={{margin: '20px', padding: '10px', background: '#f5f5f5', textAlign: 'left'}}>
                <h4>Authentication Debug Info:</h4>
                <pre style={{overflow: 'auto'}}>{JSON.stringify(authDebug, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </UnauthenticatedTemplate>

      <AuthenticatedTemplate>
        <div className="input-container">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI assistant anything..."
            rows={4}
            className="prompt-input"
            aria-label="Prompt input"
          />
          
          <button 
            onClick={handleSubmit} 
            disabled={loading || !prompt.trim()}
            className="submit-button"
            aria-label="Submit prompt"
          >
            {loading ? 'Thinking...' : 'Ask AI'}
          </button>
          
          {/* Debug button for testing API directly */}
          <button 
            onClick={async () => {
              try {
                setLoading(true);
                setError(null);
                
                // Direct API call without authentication
                const response = await fetch(API_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prompt: prompt || 'Hello from debug button' })
                });
                
                console.log("Debug API response status:", response.status);
                
                if (!response.ok) {
                  throw new Error(`API debug call failed: ${response.status}`);
                }
                
                const data = await response.json();
                console.log("Debug API response:", data);
                setResponse(data.response);
                setSubmitted(true);
              } catch (error) {
                console.error("Debug API call failed:", error);
                setError(`Debug API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
              } finally {
                setLoading(false);
              }
            }}
            style={{ marginLeft: '10px', background: '#6b7280' }}
          >
            Debug API (No Auth)
          </button>
        </div>

        {error && (
          <div className="error-message">
            <h3>Error:</h3>
            <p>{error}</p>
            <p className="error-help">
              This might be due to missing or incorrect Azure OpenAI credentials.
              Please check the backend logs for more details.
            </p>
          </div>
        )}

        {submitted && (
          <div className="response-container">
            <h2>AI Response:</h2>
            <div className="response-content">
              {loading ? (
                <p>Generating response, please wait...</p>
              ) : (
                <div className="ai-response">
                  {response.split('\n').map((line, index) => (
                    line.trim() ? <p key={index}>{line}</p> : <br key={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AuthenticatedTemplate>
    </div>
  )
}

export default App
