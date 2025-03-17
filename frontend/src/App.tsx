import { useState, useEffect } from 'react'
import { useMsal, useIsAuthenticated, AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react"
import { InteractionStatus, InteractionType, PopupRequest, RedirectRequest } from "@azure/msal-browser"
import { loginRequest } from "./authConfig"
import './App.css'

// API URL from environment variables - automatically switches between local and production
const API_URL = import.meta.env.VITE_API_URL || 'https://yang2-api.azurewebsites.net/api/prompt';
console.log('Using API URL:', API_URL);

function App() {
  const { instance, inProgress, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  // Get user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      const account = accounts[0];
      setUserName(account.name || account.username || "Authenticated User");
    }
  }, [isAuthenticated, accounts]);

  // Monitor auth status
  useEffect(() => {
    console.log("Auth status:", {
      isAuthenticated,
      inProgress,
      accounts: accounts.length,
      accountNames: accounts.map(a => a.name || a.username)
    });
  }, [isAuthenticated, inProgress, accounts]);

  const handleLogin = async () => {
    setAuthError(null);
    
    if (inProgress !== InteractionStatus.None) {
      console.log('Authentication already in progress');
      return;
    }
    
    try {
      // Try popup login first, fall back to redirect
      try {
        const loginPopupRequest: PopupRequest = {
          ...loginRequest,
          prompt: 'select_account'
        };
        
        const response = await instance.loginPopup(loginPopupRequest);
        console.log("Login successful:", response);
        
        if (response.account) {
          setUserName(response.account.name || response.account.username || "Authenticated User");
        }
      } catch (popupError: any) {
        console.log("Popup login failed, trying redirect:", popupError);
        
        // If popup fails, try redirect
        const loginRedirectRequest: RedirectRequest = {
          ...loginRequest,
          prompt: 'select_account',
          redirectStartPage: window.location.href
        };
        
        await instance.loginRedirect(loginRedirectRequest);
      }
    } catch (error: any) {
      console.error("Login completely failed:", error);
      setAuthError(`Login failed: ${error.message || 'Unknown error'}`);
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
            const tokenResponse = await instance.acquireTokenPopup(loginRequest);
            headers['Authorization'] = `Bearer ${tokenResponse.accessToken}`;
            console.log("Token acquired through popup");
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
      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt })
      })
      
      if (!response.ok) {
        // Try to get the detailed error message from the response
        let errorMessage = `Server responded with status: ${response.status}`;
        try {
          const errorResponse = await response.json();
          if (errorResponse.detail) {
            errorMessage = `Error: ${errorResponse.detail}`;
          }
        } catch (e) {
          // If we can't parse the JSON, just use the status message
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json()
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
