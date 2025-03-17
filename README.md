# Azure OpenAI Integration Project

This project demonstrates integration with Azure OpenAI services through a React frontend and FastAPI backend, with Microsoft Entra ID authentication.

## Project Overview

This solution provides a web interface to interact with Azure OpenAI's GPT models. The application consists of:

- A **React/TypeScript frontend** hosted on Azure Static Web Apps
- A **Python FastAPI backend** running on Azure App Service 
- **Microsoft Entra ID** integration for secure authentication
- **Azure OpenAI** service for AI model inference

Users can authenticate, submit prompts to AI models, and receive responses in a secure and scalable environment.

## Azure Services Used

### Azure Static Web Apps

- **Purpose**: Hosts the frontend React application
- **Features**:
  - Global CDN distribution
  - Free SSL certificates
  - Custom domain support
  - CI/CD integration (removed in favor of CLI-based deployment)
  - Custom routing configuration via `staticwebapp.config.json`

### Azure App Service

- **Purpose**: Hosts the backend Python FastAPI application
- **Features**:
  - Built-in autoscaling
  - Support for Python applications
  - Integrated with Azure Monitor
  - Environment variable configuration
  - Deployment via Azure CLI

### Azure OpenAI Service

- **Purpose**: Provides access to advanced AI models like GPT-4o mini
- **Features**:
  - Access to state-of-the-art AI models
  - Content safety filtering
  - Usage monitoring and quotas
  - Configurable model deployments
  - Token-based billing

### Microsoft Entra ID (formerly Azure AD)

- **Purpose**: Provides authentication and authorization
- **Features**:
  - Single sign-on (SSO) with Microsoft accounts
  - JWT token-based authentication
  - Role-based access control
  - Integration with other Azure services
  - Multi-tenant support

## Project Structure

```
.
├── backend/                  # Python FastAPI Backend
│   ├── main.py               # Main API implementation 
│   ├── requirements.txt      # Python dependencies
│   ├── startup.sh            # App Service startup script
│   └── .env                  # Environment variables (not in version control)
│
├── frontend/                 # React/TypeScript Frontend
│   ├── src/                  # Source code
│   │   ├── App.tsx           # Main application component
│   │   ├── authConfig.ts     # Entra ID configuration
│   │   └── ...               # Other frontend code
│   ├── public/               # Static assets
│   ├── package.json          # Node.js dependencies
│   ├── vite.config.ts        # Vite configuration
│   └── .env.production       # Production environment variables
│
├── deploy.sh                 # Unified deployment script
└── README.md                 # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Azure CLI
- Azure subscription with the following resources:
  - Azure Static Web App
  - Azure App Service
  - Azure OpenAI service
  - Microsoft Entra ID tenant with app registration

### Local Development

See [README-LOCAL-DEVELOPMENT.md](README-LOCAL-DEVELOPMENT.md) for detailed instructions on setting up your local development environment.

#### Backend

```bash
cd backend
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Azure OpenAI credentials

# Run the development server
python main.py
```

#### Frontend

```bash
cd frontend
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Authentication Setup

For detailed instructions on setting up Microsoft Entra ID authentication, see [README-AUTHENTICATION.md](README-AUTHENTICATION.md).

## Deployment

This project uses a unified CLI-based deployment approach. For detailed deployment instructions, see [README-DEPLOYMENT.md](README-DEPLOYMENT.md).

Quick deployment:

```bash
# From the project root
chmod +x deploy.sh  # First time only
./deploy.sh
```

## Troubleshooting

### Backend Issues

- If experiencing Azure OpenAI connection issues, see [OPENAI-API-TROUBLESHOOTING.md](OPENAI-API-TROUBLESHOOTING.md)
- For Azure SDK issues, see [AZURE-SDK-TROUBLESHOOTING.md](AZURE-SDK-TROUBLESHOOTING.md)

### Frontend Issues

- If experiencing authentication issues, check the Entra ID app registration configuration
- For MIME type issues, verify the `staticwebapp.config.json` and `web.config` files are correctly deployed

### Deployment Issues

- If deployment fails, check the Azure CLI is logged in to the correct subscription
- Verify you have the correct permissions for the Azure resources

## Resources

- [Azure Static Web Apps documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure App Service documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure OpenAI Service documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
- [Microsoft Entra ID documentation](https://docs.microsoft.com/en-us/azure/active-directory/)
- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [React documentation](https://reactjs.org/docs/getting-started.html) 