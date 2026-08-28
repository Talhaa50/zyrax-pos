#!/bin/bash
set -e

echo "🔍 Verifying Zyrax POS deployment..."

# Check if dist/ exists
if [ ! -d "dist" ]; then
  echo "❌ ERROR: dist/ folder not found!"
  echo "📦 Building frontend now..."
  npm run build
  echo "✅ Frontend built"
fi

if [ ! -d "dist" ]; then
  echo "❌ CRITICAL: Frontend build failed!"
  exit 1
fi

echo "✅ dist/ folder exists"
echo "✅ Starting server..."

# Start the server
exec npm run start-server
