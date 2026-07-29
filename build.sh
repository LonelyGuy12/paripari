#!/usr/bin/env bash
set -e

echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Building Backend..."
cd backend
pip install -r requirements.txt
echo "Build complete."
