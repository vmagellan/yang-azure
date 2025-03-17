#!/bin/bash

# Ensure correct MIME types
echo "Setting up correct MIME types for JavaScript modules..."

# Copy web.config to build directory
echo "Copying web.config to build directory"
cp web.config dist/web.config

# Copy staticwebapp.config.json to build directory
echo "Copying staticwebapp.config.json to build directory"
cp staticwebapp.config.json dist/staticwebapp.config.json

# Create .nojekyll file to prevent GitHub Pages from ignoring files that begin with an underscore
touch dist/.nojekyll

echo "Deployment script completed" 