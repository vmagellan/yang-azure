// Microsoft Authentication Library (MSAL) configuration for Microsoft Entra
// Replace the placeholder values with your actual Azure AD app registration values

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

// Scopes for the token request - Microsoft Graph API permissions
export const loginRequest = {
  scopes: ["User.Read"]
};

// Microsoft Graph API endpoint for user information
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
}; 