#!/bin/bash

echo "🔥 Starting S.A.S.S.Y Argument Bot 🔥"
echo "=================================="

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Setup backend dependencies
echo "📦 Setting up backend dependencies..."
cd backend
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file - please add your ANTHROPIC_API_KEY"
    echo "ANTHROPIC_API_KEY=your_anthropic_api_key_here" > .env
fi

# Install Python dependencies
pip install -r requirements.txt

echo "✅ Backend setup complete!"

# Go back to main directory
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete!"

# Start both frontend and backend
echo "🚀 Starting both frontend and backend..."
echo "Frontend will be available at: http://localhost:5173"
echo "Backend API will be available at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers"

npm run start 