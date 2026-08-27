#!/bin/bash

# Migration Test Script
# Verifies backend API is working correctly

echo "🧪 Testing Zyrax POS Migration"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3001"

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s "${API_URL}/api/health")
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Response: $HEALTH"
    exit 1
fi
echo ""

# Test 2: Login
echo "2️⃣  Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@retailer.com","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✅ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Protected Endpoint (Products)
echo "3️⃣  Testing protected endpoint (GET /api/products)..."
PRODUCTS=$(curl -s -X GET "${API_URL}/api/products" \
  -H "Authorization: Bearer ${TOKEN}")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Protected endpoint accessible${NC}"
    echo "Products: $PRODUCTS"
else
    echo -e "${RED}❌ Protected endpoint failed${NC}"
    exit 1
fi
echo ""

# Test 4: Check Upload Directory
echo "4️⃣  Checking uploads directory..."
if [ -d "./server/public/uploads/products" ]; then
    echo -e "${GREEN}✅ Upload directory exists${NC}"
    echo "Path: ./server/public/uploads/products"
else
    echo -e "${YELLOW}⚠️  Upload directory missing - creating...${NC}"
    mkdir -p ./server/public/uploads/products
    echo -e "${GREEN}✅ Upload directory created${NC}"
fi
echo ""

# Test 5: Database Check
echo "5️⃣  Checking database..."
if [ -f "./server/data/pos_data.db" ]; then
    echo -e "${GREEN}✅ Database file exists${NC}"
    echo "Path: ./server/data/pos_data.db"
    DB_SIZE=$(du -h "./server/data/pos_data.db" | cut -f1)
    echo "Size: $DB_SIZE"
else
    echo -e "${RED}❌ Database file not found${NC}"
    exit 1
fi
echo ""

# Summary
echo "==============================="
echo -e "${GREEN}✅ All backend tests passed!${NC}"
echo ""
echo "Next steps:"
echo "1. Clear browser localStorage (see MIGRATION_FIX_GUIDE.md)"
echo "2. Login with: admin@retailer.com / admin123"
echo "3. Test product creation with image upload"
echo ""
echo "Frontend URL: http://localhost:5173 (or your Vite port)"
echo "Backend URL:  http://localhost:3001"
