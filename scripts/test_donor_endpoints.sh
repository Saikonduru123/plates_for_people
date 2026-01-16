#!/bin/bash

echo "🧪 Testing Donor Endpoints"
echo "================================"
echo ""

# Get token by logging in
echo "1️⃣  Logging in as donor..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdonor@example.com",
    "password": "securepass123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get access token"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Test get donor profile
echo "2️⃣  Testing GET /api/donors/profile..."
curl -s -X GET http://localhost:8000/api/donors/profile \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test donor dashboard
echo "3️⃣  Testing GET /api/donors/dashboard..."
curl -s -X GET http://localhost:8000/api/donors/dashboard \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test update donor profile
echo "4️⃣  Testing PUT /api/donors/profile..."
curl -s -X PUT http://localhost:8000/api/donors/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Updated Food Services Inc",
    "phone": "+1-555-9999",
    "address_line1": "456 New Street"
  }' | python3 -m json.tool
echo ""

# Verify the update
echo "5️⃣  Verifying profile update..."
curl -s -X GET http://localhost:8000/api/donors/profile \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

echo "✅ Donor endpoint tests completed!"
