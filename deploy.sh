#!/bin/bash

# Set variables
RESOURCE_GROUP="yang2"
FRONTEND_APP_NAME="jolly-stone-0b1f54d03"
BACKEND_APP_NAME="yang2-api"
DEPLOYMENT_TOKEN=""  # Leave empty to be prompted

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section header
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
az account show &> /dev/null
if [ $? -ne 0 ]; then
    print_header "Logging in to Azure"
    az login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to log in to Azure. Exiting.${NC}"
        exit 1
    fi
fi

# Prompt for deployment token if not provided
if [ -z "$DEPLOYMENT_TOKEN" ]; then
    echo -e "${YELLOW}Please enter your Static Web App deployment token:${NC}"
    read -s DEPLOYMENT_TOKEN
    if [ -z "$DEPLOYMENT_TOKEN" ]; then
        echo -e "${RED}No deployment token provided. Exiting.${NC}"
        exit 1
    fi
fi

# Function to deploy backend
deploy_backend() {
    print_header "Deploying Backend"
    
    echo "Creating deployment package..."
    cd backend
    zip -r ../azure-backend-deployment.zip . -x "*.pyc" -x "__pycache__/*" -x "venv/*"
    cd ..
    
    echo "Deploying to Azure App Service..."
    az webapp deploy --resource-group "$RESOURCE_GROUP" --name "$BACKEND_APP_NAME" --src-path azure-backend-deployment.zip --type zip
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Backend deployment successful!${NC}"
        echo "API URL: https://$BACKEND_APP_NAME.azurewebsites.net"
        
        # Optional: Test the API
        echo "Testing API..."
        curl -s "https://$BACKEND_APP_NAME.azurewebsites.net/api/debug" | jq
    else
        echo -e "${RED}Backend deployment failed.${NC}"
        echo "Check logs with: az webapp log tail --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP"
    fi
}

# Function to deploy frontend
deploy_frontend() {
    print_header "Deploying Frontend"
    
    # Build the frontend
    echo "Building frontend..."
    cd frontend
    npm run build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Frontend build failed. Exiting.${NC}"
        cd ..
        exit 1
    fi
    
    # Create .nojekyll file to prevent GitHub Pages from ignoring files that begin with underscore
    echo "Creating .nojekyll file..."
    touch dist/.nojekyll
    
    # Deploy to Azure Static Web Apps
    echo "Deploying to Azure Static Web Apps..."
    npx @azure/static-web-apps-cli deploy dist --deployment-token "$DEPLOYMENT_TOKEN" --env production
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Frontend deployment successful!${NC}"
        echo "Frontend URL: https://$FRONTEND_APP_NAME.6.azurestaticapps.net"
    else
        echo -e "${RED}Frontend deployment failed.${NC}"
    fi
    
    cd ..
}

# Main menu
show_menu() {
    print_header "Azure Deployment CLI"
    echo "1) Deploy Backend Only"
    echo "2) Deploy Frontend Only"
    echo "3) Deploy Both (Backend first, then Frontend)"
    echo "4) Exit"
    echo ""
    echo -n "Enter choice [1-4]: "
    read choice
    
    case $choice in
        1) deploy_backend ;;
        2) deploy_frontend ;;
        3) 
            deploy_backend
            deploy_frontend
            ;;
        4) exit 0 ;;
        *) 
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            show_menu
            ;;
    esac
}

# Show the deployment menu
show_menu

echo -e "\n${GREEN}Deployment script completed!${NC}" 