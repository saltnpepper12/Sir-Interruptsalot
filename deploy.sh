#!/bin/bash

# Argubot UI Deployment Script
# Simple deployment for your React/TypeScript UI application

set -e  # Exit on any error

echo "🚀 Starting Argubot UI deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the UI directory."
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies!"
    exit 1
fi

# Build the application
print_status "Building the application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build completed successfully!"
else
    print_error "Build failed!"
    exit 1
fi

# Check build output
if [ ! -d "dist" ]; then
    print_error "Build directory 'dist' not found!"
    exit 1
fi

print_success "Build artifacts created in 'dist' directory"

# Show deployment options
echo ""
echo "🎯 Your app is ready to deploy!"
echo ""
echo "Quick deployment options:"
echo ""
echo "1) 📦 Netlify Drop (Easiest)"
echo "   - Go to https://app.netlify.com/drop"
echo "   - Drag the 'dist' folder to the page"
echo "   - Your app will be live instantly!"
echo ""
echo "2) 🚀 Vercel (Fast)"
echo "   - Install: npm i -g vercel"
echo "   - Run: npx vercel --prod"
echo ""
echo "3) 🌊 Surge.sh (Simple)"
echo "   - Install: npm i -g surge" 
echo "   - Run: npx surge dist/"
echo ""
echo "4) 📁 Manual Upload"
echo "   - Upload contents of 'dist' folder to any web host"
echo ""

print_success "Deployment script completed!"
print_status "Your built files are in the 'dist' directory - ready to deploy!"
