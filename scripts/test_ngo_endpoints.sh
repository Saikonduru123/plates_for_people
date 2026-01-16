#!/bin/bash

echo "🧪 Testing NGO Endpoints"
echo "================================"
echo ""

# Register a new NGO
echo "1️⃣  Registering new NGO..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/register/ngo \
  -H "Content-Type: application/json" \
  -d '{
    "user_data": {
      "email": "testngo@example.com",
      "password": "securepass123",
      "role": "ngo"
    },
    "profile_data": {
      "organization_name": "Test Food Bank",
      "registration_number": "NGO123456",
      "contact_person": "Jane Smith",
      "phone": "+1234567890"
    }
  }')

TOKEN=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to register NGO"
    echo "$REGISTER_RESPONSE" | python3 -m json.tool
    echo ""
    echo "⚠️  Trying to login with existing NGO..."
    LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "testngo@example.com",
        "password": "securepass123"
      }')
    TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get access token"
    exit 1
fi

echo "✅ NGO authenticated successfully"
echo ""

# Test get NGO profile
echo "2️⃣  Testing GET /api/ngos/profile..."
curl -s -X GET http://localhost:8000/api/ngos/profile \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test NGO dashboard
echo "3️⃣  Testing GET /api/ngos/dashboard..."
curl -s -X GET http://localhost:8000/api/ngos/dashboard \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

# Test update NGO profile
echo "4️⃣  Testing PUT /api/ngos/profile..."
curl -s -X PUT http://localhost:8000/api/ngos/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1-555-8888",
    "website": "https://updated-foodbank.org",
    "operating_hours": "Mon-Sat 8AM-6PM"
  }' | python3 -m json.tool
echo ""

# Test create NGO location
echo "5️⃣  Testing POST /api/ngos/locations..."
LOCATION_RESPONSE=$(curl -s -X POST http://localhost:8000/api/ngos/locations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location_name": "Main Distribution Center",
    "address": "100 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postal_code": "10001",
    "latitude": 40.7128,
    "longitude": -74.0060
  }')

echo "$LOCATION_RESPONSE" | python3 -m json.tool
LOCATION_ID=$(echo $LOCATION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")
echo ""

# Test get all locations
echo "6️⃣  Testing GET /api/ngos/locations..."
curl -s -X GET http://localhost:8000/api/ngos/locations \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo ""

if [ ! -z "$LOCATION_ID" ]; then
    # Test set capacity for location
    echo "7️⃣  Testing POST /api/ngos/locations/$LOCATION_ID/capacity..."
    curl -s -X POST "http://localhost:8000/api/ngos/locations/$LOCATION_ID/capacity" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "date": "2026-01-20",
        "meal_type": "lunch",
        "total_capacity": 100
      }' | python3 -m json.tool
    echo ""

    # Test get location capacity
    echo "8️⃣  Testing GET /api/ngos/locations/$LOCATION_ID/capacity..."
    curl -s -X GET "http://localhost:8000/api/ngos/locations/$LOCATION_ID/capacity?start_date=2026-01-20&end_date=2026-01-25" \
      -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
    echo ""
fi

echo "✅ NGO endpoint tests completed!"
