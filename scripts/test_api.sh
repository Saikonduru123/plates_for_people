#!/bin/bash
# Test script for Plates for People API

BASE_URL="http://localhost:8000"

echo "🧪 Testing Plates for People API"
echo "================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing health check..."
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""

# Test 2: Register Donor
echo "2️⃣  Testing donor registration..."
DONOR_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register/donor" \
  -H "Content-Type: application/json" \
  -d '{
    "user_data": {
      "email": "testdonor@example.com",
      "password": "securepass123",
      "role": "donor"
    },
    "profile_data": {
      "organization_name": "Test Restaurant",
      "contact_person": "John Doe",
      "phone": "+1234567890",
      "address_line1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "country": "USA",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }')

echo "$DONOR_RESPONSE" | python3 -m json.tool
DONOR_TOKEN=$(echo "$DONOR_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)
echo ""

# Test 3: Login
echo "3️⃣  Testing donor login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdonor@example.com",
    "password": "securepass123"
  }')

echo "$LOGIN_RESPONSE" | python3 -m json.tool
LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)
echo ""

# Test 4: Get Current User
if [ -n "$LOGIN_TOKEN" ]; then
  echo "4️⃣  Testing get current user..."
  curl -s "$BASE_URL/api/auth/me" \
    -H "Authorization: Bearer $LOGIN_TOKEN" | python3 -m json.tool
  echo ""
fi

echo "✅ Tests completed!"
