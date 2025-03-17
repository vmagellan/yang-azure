import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import './index.css'
import App from './App.tsx'
import { msalConfig } from './authConfig'

async function initializeMsal() {
  // Initialize MSAL
  const msalInstance = new PublicClientApplication(msalConfig);
  
  // Initialize MSAL instance first - this is crucial
  await msalInstance.initialize();
  
  console.log("MSAL initialized successfully");
  
  // Add event callbacks to handle redirect response
  msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS) {
      console.log("Login success event received");
      const result = event.payload as AuthenticationResult;
      msalInstance.setActiveAccount(result.account);
    }
    if (event.eventType === EventType.LOGIN_FAILURE) {
      console.error('MSAL Login Failure:', event.error?.message);
    }
    // Log all events for debugging
    console.log(`MSAL Event: ${event.eventType}`, event);
  });
  
  // Default to using the first account if available
  // This handles the case where a user is already logged in
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    console.log("Found existing accounts:", accounts.length);
    msalInstance.setActiveAccount(accounts[0]);
  }

  // Handle the redirect flow on page load if necessary - only after initialization
  try {
    const response = await msalInstance.handleRedirectPromise();
    if (response) {
      console.log("Redirect handled successfully:", response);
    }
  } catch (error) {
    console.error('Error handling redirect:', error);
  }

  // Render the application
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  );
}

// Start the initialization process
initializeMsal().catch(error => {
  console.error("Failed to initialize MSAL:", error);
  // Render a fallback UI if MSAL fails to initialize
  createRoot(document.getElementById('root')!).render(
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      textAlign: 'center' 
    }}>
      <h1>Authentication Error</h1>
      <p>There was a problem initializing the authentication system.</p>
      <p>Please refresh the page or contact support if the issue persists.</p>
      <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto', textAlign: 'left' }}>
        {error instanceof Error ? error.message : 'Unknown error'}
      </pre>
    </div>
  );
});
