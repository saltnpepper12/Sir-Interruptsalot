@echo off
REM One-shot dev launcher: installs deps and starts frontend + backend together.

echo Starting Sir Interruptsalot
echo ===========================

python --version >nul 2>&1
if errorlevel 1 (
    echo Python 3.8+ is required.
    pause
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js 16+ is required.
    pause
    exit /b 1
)

REM Backend
echo Installing backend dependencies...
cd backend
pip install -r requirements.txt

if not exist ".env" (
    if exist ".env.example" copy ".env.example" ".env"
    echo Created backend/.env -- fill in ANTHROPIC_API_KEY and SERPER_API_KEY before starting.
    cd ..
    pause
    exit /b 1
)
cd ..

REM Frontend
echo Installing frontend dependencies...
npm install

echo Launching services (frontend :5173, backend :8000). Ctrl+C to stop.
npm run start
