#!/usr/bin/env bash
# One-shot dev launcher: installs deps and starts frontend + backend together.
set -e

echo "Starting Sir Interruptsalot"
echo "==========================="

command -v python >/dev/null 2>&1 || { echo "Python 3.8+ is required."; exit 1; }
command -v node   >/dev/null 2>&1 || { echo "Node.js 16+ is required."; exit 1; }

# Backend
echo "Installing backend dependencies..."
(cd backend && pip install -r requirements.txt)

if [ ! -f backend/.env ]; then
  if [ -f backend/.env.example ]; then
    cp backend/.env.example backend/.env
  fi
  echo "Created backend/.env — fill in ANTHROPIC_API_KEY and SERPER_API_KEY before starting."
  exit 1
fi

# Frontend
echo "Installing frontend dependencies..."
npm install

echo "Launching services (frontend :5173, backend :8000). Ctrl+C to stop."
npm run start
