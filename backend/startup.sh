#!/bin/bash

# Make sure the script runs in the right directory
cd /home/site/wwwroot

# Install dependencies
pip install -r requirements.txt

# Start the application using Gunicorn
gunicorn main:app --bind=0.0.0.0:8000 --timeout 120 -k uvicorn.workers.UvicornWorker 