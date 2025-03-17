import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import './index.css'
import App from './App.tsx'
import { msalConfig } from './authConfig'

// Initialize MSAL
const msalInstance = new PublicClientApplication(msalConfig)

// Check if there are already cached accounts
if (msalInstance.getAllAccounts().length > 0) {
  // If accounts are found, set the first one as active
  msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0])
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </StrictMode>,
)
