#!/usr/bin/env bash
# Build the frontend for static hosting. After this completes, the contents of
# ./dist/ can be deployed to any static host (Netlify, Vercel, Render, S3, etc.).
set -euo pipefail

if [ ! -f "package.json" ]; then
  echo "package.json not found. Run this script from the repository root."
  exit 1
fi

echo "Installing dependencies..."
npm install

echo "Building..."
npm run build

if [ ! -d "dist" ]; then
  echo "Build did not produce dist/."
  exit 1
fi

echo "Build complete. Artifacts in ./dist/"
