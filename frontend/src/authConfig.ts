// Microsoft Authentication Library (MSAL) configuration for Microsoft Entra
// Replace the placeholder values with your actual Azure AD app registration values

export const msalConfig = {
  auth: {
    clientId: "dced1b9b-2699-4e98-a951-92cbbe629bd2", // Your App Registration Client ID
    authority: "https://login.microsoftonline.com/85786e75-baa3-495f-9103-20fe6fb996d4", // Your Tenant ID
    redirectUri: window.location.origin, // Will use the current URL as redirect URL
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// Scopes for the token request - Microsoft Graph API permissions
export const loginRequest = {
  scopes: ["User.Read"]
};

// Microsoft Graph API endpoint for user information
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
}; 