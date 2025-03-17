// Microsoft Authentication Library (MSAL) configuration for Microsoft Entra
// Replace the placeholder values with your actual Azure AD app registration values

export const msalConfig = {
  auth: {
    clientId: "dced1b9b-2699-4e98-a951-92cbbe629bd2", // Your App Registration Client ID
    authority: "https://login.microsoftonline.com/85786e75-baa3-495f-9103-20fe6fb996d4", // Your Tenant ID
    redirectUri: window.location.origin, // Will use the current URL as redirect URL
    navigateToLoginRequestUrl: true,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false, // Changed to false as this is only needed for IE11
  },
  system: {
    allowRedirectInIframe: true, // Needed for popup/redirect in SPAs
    loggerOptions: {
      loggerCallback: (level: number, message: string, containsPii: boolean) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0:
            console.error('MSAL ERROR:', message);
            break;
          case 1:
            console.warn('MSAL WARNING:', message);
            break;
          case 2:
            console.info('MSAL INFO:', message);
            break;
          case 3:
            console.debug('MSAL DEBUG:', message);
            break;
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3, // DEBUG level for more verbose logging during troubleshooting
    }
  }
};

// Scopes for the token request - Microsoft Graph API permissions
export const loginRequest = {
  scopes: ["User.Read"],
  // Make sure this is set for SPA auth flow
  prompt: "select_account"
};

// Microsoft Graph API endpoint for user information
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
}; 