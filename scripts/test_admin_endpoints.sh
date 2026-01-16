#!/bin/bash

echo "🧪 Testing Admin Endpoints"
echo "================================"
echo ""

# Login as admin
echo "1️⃣  Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdonor@example.com",
    "password": "securepass123"
  }')

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to login as admin"
    exit 1
fi

echo "✅ Logged in as admin successfully"
echo ""

# Test admin dashboard
echo "2️⃣  Testing GET /api/admin/dashboard..."
curl -s -X GET http://localhost:8000/api/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
echo ""

# Test get pending NGOs
echo "3️⃣  Testing GET /api/admin/ngos/pending..."
PENDING_RESPONSE=$(curl -s -X GET http://localhost:8000/api/admin/ngos/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$PENDING_RESPONSE" | python3 -m json.tool
echo ""

# Extract first NGO ID if exists
NGO_ID=$(echo "$PENDING_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data[0]['id'] if data and len(data) > 0 else '')" 2>/dev/null)

if [ ! -z "$NGO_ID" ]; then
    # Test get NGO details
    echo "4️⃣  Testing GET /api/admin/ngos/$NGO_ID..."
    curl -s -X GET "http://localhost:8000/api/admin/ngos/$NGO_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
    echo ""
    
    # Test verify NGO
    echo "5️⃣  Testing POST /api/admin/ngos/$NGO_ID/verify..."
    curl -s -X POST "http://localhost:8000/api/admin/ngos/$NGO_ID/verify" \
      -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
    echo ""
    
    # Verify the NGO can now login and access their profile
    echo "6️⃣  Testing NGO login after verification..."
    NGO_LOGIN=$(curl -s -X POST http://localhost:8000/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "testngo@example.com",
        "password": "securepass123"
      }')
    
    NGO_TOKEN=$(echo $NGO_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")
    
    if [ ! -z "$NGO_TOKEN" ]; then
        echo "✅ NGO can now login!"
        echo ""
        
        echo "7️⃣  Testing NGO profile access after verification..."
        curl -s -X GET http://localhost:8000/api/ngos/profile \
          -H "Authorization: Bearer $NGO_TOKEN" | python3 -m json.tool
        echo ""
    fi
else
    echo "⚠️  No pending NGOs found to test verification"
fi

# Test get all NGOs
echo "8️⃣  Testing GET /api/admin/ngos/all..."
curl -s -X GET "http://localhost:8000/api/admin/ngos/all" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | python3 -m json.tool
echo ""

echo "✅ Admin endpoint tests completed!"
