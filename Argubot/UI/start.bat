@echo off
echo 🔥 Starting S.A.S.S.Y Argument Bot 🔥
echo ==================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Setup backend dependencies
echo 📦 Setting up backend dependencies...
cd backend

if not exist ".env" (
    echo ⚠️  Creating .env file - please add your ANTHROPIC_API_KEY
    echo ANTHROPIC_API_KEY=your_anthropic_api_key_here > .env
)

REM Install Python dependencies
pip install -r requirements.txt
echo ✅ Backend setup complete!

REM Go back to main directory
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
npm install
echo ✅ Frontend setup complete!

REM Start both frontend and backend
echo 🚀 Starting both frontend and backend...
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:8000
echo.
echo Press Ctrl+C to stop both servers

npm run start

pause 