#!/bin/bash

echo "🔍 Testing NGO Search API"
echo "======================================="
echo ""

# Step 1: Login as donor
echo "1️⃣  Logging in as donor..."
DONOR_LOGIN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdonor@example.com",
    "password": "securepass123"
  }')

DONOR_TOKEN=$(echo $DONOR_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$DONOR_TOKEN" ]; then
    echo "❌ Failed to login as donor"
    exit 1
fi

echo "✅ Donor logged in"
echo ""

# Step 2: Search for NGOs near New York City (40.7128° N, 74.0060° W)
echo "2️⃣  Searching for NGOs within 50km of NYC..."
curl -s -X GET "http://localhost:8000/api/search/ngos?latitude=40.7128&longitude=-74.0060&radius=50" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

# Step 3: Search with capacity filter
echo "3️⃣  Searching for NGOs with available capacity for lunch on 2026-01-26..."
curl -s -X GET "http://localhost:8000/api/search/ngos?latitude=40.7128&longitude=-74.0060&radius=50&donation_date=2026-01-26&meal_type=lunch&min_capacity=20" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

# Step 4: Get nearby summary
echo "4️⃣  Getting nearby NGO summary..."
curl -s -X GET "http://localhost:8000/api/search/nearby-summary?latitude=40.7128&longitude=-74.0060&radius=50" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

# Step 5: Search near Boston (42.3601° N, 71.0589° W)
echo "5️⃣  Searching for NGOs within 20km of Boston..."
curl -s -X GET "http://localhost:8000/api/search/ngos?latitude=42.3601&longitude=-71.0589&radius=20" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

# Step 6: Get location availability (using location ID 4 from NYC search)
echo "6️⃣  Checking availability for location 4 (next 7 days)..."
START_DATE=$(date +%Y-%m-%d)
END_DATE=$(date -d "+7 days" +%Y-%m-%d)

curl -s -X GET "http://localhost:8000/api/search/ngos/4/availability?start_date=$START_DATE&end_date=$END_DATE" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

# Step 7: Very tight radius search (1km)
echo "7️⃣  Searching within 1km radius (tight search)..."
curl -s -X GET "http://localhost:8000/api/search/ngos?latitude=40.7128&longitude=-74.0060&radius=1" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

# Step 8: Wide radius search with min capacity
echo "8️⃣  Searching within 100km with minimum 50 plates capacity..."
curl -s -X GET "http://localhost:8000/api/search/ngos?latitude=40.7128&longitude=-74.0060&radius=100&donation_date=2026-01-25&meal_type=lunch&min_capacity=50" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

echo "✅ Search API test completed!"
