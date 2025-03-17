#!/bin/bash

# Make sure the script runs in the right directory
cd /home/site/wwwroot || exit 1

echo "Starting Azure Web App deployment..."

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Start the application using Gunicorn
echo "Starting the application with Gunicorn..."
gunicorn main:app --bind=0.0.0.0:8000 --timeout 600 -k uvicorn.workers.UvicornWorker 