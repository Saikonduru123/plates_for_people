#!/bin/bash

# Quick Test Script - Register and Login

BASE_URL="http://localhost:8000/api"

echo "========================================="
echo "Quick Test - Register & Login"
echo "========================================="
echo ""

# Test 1: Register a donor
echo "1. Registering new donor..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register/donor" \
  -H "Content-Type: application/json" \
  -d '{
    "user_data": {
      "email": "quicktest@example.com",
      "password": "password123",
      "role": "donor"
    },
    "profile_data": {
      "organization_name": "Quick Test Restaurant",
      "contact_person": "Test User",
      "phone": "+919876543210",
      "address": "123 Test Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India",
      "postal_code": "400001",
      "latitude": 19.0760,
      "longitude": 72.8777
    }
  }')

echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null

if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
  echo "✅ Registration successful!"
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
  echo "   Token: ${ACCESS_TOKEN:0:20}..."
elif echo "$REGISTER_RESPONSE" | grep -q "already registered"; then
  echo "ℹ️  User already exists, trying login..."
  
  # Try login
  LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"quicktest@example.com","password":"password123"}')
  
  if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ Login successful!"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
    echo "   Token: ${ACCESS_TOKEN:0:20}..."
  else
    echo "❌ Login failed"
    echo "$LOGIN_RESPONSE"
    exit 1
  fi
else
  echo "❌ Registration failed"
  echo "$REGISTER_RESPONSE"
  exit 1
fi

echo ""
echo "========================================="
echo "✅ Test Complete!"
echo "========================================="
echo ""
echo "You can now login with:"
echo "Email: quicktest@example.com"
echo "Password: password123"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:8000"
echo ""
