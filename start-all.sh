#!/bin/bash

# Startup script for Zyrax POS
# Starts both backend and frontend servers

echo "🚀 Starting Zyrax POS System"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing frontend dependencies...${NC}"
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installing backend dependencies...${NC}"
    cd server && npm install && cd ..
fi

echo -e "${GREEN}✅ Dependencies ready${NC}"
echo ""

# Check if database exists
if [ ! -f "server/data/pos_data.db" ]; then
    echo -e "${YELLOW}⚠️  Database not found. Seeding...${NC}"
    cd server && node seed-users.js && cd ..
else
    echo -e "${GREEN}✅ Database ready${NC}"
fi

echo ""
echo -e "${BLUE}📡 Starting servers...${NC}"
echo ""
echo -e "${BLUE}Backend:${NC}  http://localhost:3001"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""
echo "=============================="
echo ""

# Start both servers concurrently
npm run dev:all
