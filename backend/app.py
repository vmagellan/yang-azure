from main import app

# This file is used by Azure App Service for deployment
# Azure App Service looks for an 'app' variable by default

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 