#!/bin/bash

echo "🧪 Testing Complete Donation Workflow"
echo "======================================="
echo ""

# Step 1: Login as verified NGO and create a location with capacity
echo "1️⃣  Logging in as NGO..."
NGO_LOGIN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testngo@example.com",
    "password": "securepass123"
  }')

NGO_TOKEN=$(echo $NGO_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$NGO_TOKEN" ]; then
    echo "❌ Failed to login as NGO"
    exit 1
fi

echo "✅ NGO logged in"
echo ""

# Step 2: Create NGO location
echo "2️⃣  Creating NGO location..."
LOCATION_RESPONSE=$(curl -s -X POST http://localhost:8000/api/ngos/locations \
  -H "Authorization: Bearer $NGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location_name": "Main Distribution Center",
    "address_line1": "100 Main St",
    "address_line2": "Suite 200",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "country": "USA",
    "latitude": 40.7128,
    "longitude": -74.0060
  }')

echo "$LOCATION_RESPONSE" | python3 -m json.tool
LOCATION_ID=$(echo $LOCATION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")
echo ""

if [ -z "$LOCATION_ID" ]; then
    echo "⚠️  Location might already exist, trying to get existing locations..."
    LOCATIONS=$(curl -s -X GET http://localhost:8000/api/ngos/locations \
      -H "Authorization: Bearer $NGO_TOKEN")
    LOCATION_ID=$(echo $LOCATIONS | python3 -c "import sys, json; data = json.load(sys.stdin); print(data[0]['id'] if data and len(data) > 0 else '')")
    echo "Using existing location ID: $LOCATION_ID"
    echo ""
fi

# Step 3: Set capacity for the location
echo "3️⃣  Setting capacity for location..."
curl -s -X POST "http://localhost:8000/api/ngos/locations/$LOCATION_ID/capacity" \
  -H "Authorization: Bearer $NGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-25",
    "meal_type": "lunch",
    "total_capacity": 100
  }' | python3 -m json.tool
echo ""

# Step 4: Login as donor
echo "4️⃣  Logging in as donor..."
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

# Step 5: Create donation request
echo "5️⃣  Creating donation request..."
DONATION_RESPONSE=$(curl -s -X POST http://localhost:8000/api/donations/requests \
  -H "Authorization: Bearer $DONOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"ngo_location_id\": $LOCATION_ID,
    \"food_type\": \"Vegetarian meals\",
    \"quantity_plates\": 50,
    \"meal_type\": \"lunch\",
    \"donation_date\": \"2026-01-25\",
    \"pickup_time_start\": \"12:00\",
    \"pickup_time_end\": \"13:00\",
    \"description\": \"Fresh vegetarian meals from our restaurant\",
    \"special_instructions\": \"Please bring insulated containers\"
  }")

echo "$DONATION_RESPONSE" | python3 -m json.tool
DONATION_ID=$(echo $DONATION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")
echo ""

if [ -z "$DONATION_ID" ]; then
    echo "❌ Failed to create donation request"
    exit 1
fi

# Step 6: Get donor's donations
echo "6️⃣  Getting donor's donations..."
curl -s -X GET http://localhost:8000/api/donations/requests/my-donations \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool
echo ""

# Step 7: NGO views pending donations
echo "7️⃣  NGO viewing pending donations..."
curl -s -X GET "http://localhost:8000/api/donations/requests/ngo-requests?status=pending" \
  -H "Authorization: Bearer $NGO_TOKEN" | python3 -m json.tool
echo ""

# Step 8: NGO confirms donation
echo "8️⃣  NGO confirming donation..."
curl -s -X POST "http://localhost:8000/api/donations/requests/$DONATION_ID/confirm" \
  -H "Authorization: Bearer $NGO_TOKEN" | python3 -m json.tool
echo ""

# Step 9: Get donation details
echo "9️⃣  Getting donation details..."
curl -s -X GET "http://localhost:8000/api/donations/requests/$DONATION_ID" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool
echo ""

# Step 10: NGO marks donation as completed
echo "🔟  NGO marking donation as completed..."
curl -s -X POST "http://localhost:8000/api/donations/requests/$DONATION_ID/complete" \
  -H "Authorization: Bearer $NGO_TOKEN" | python3 -m json.tool
echo ""

# Step 11: Verify completion
echo "1️⃣1️⃣  Verifying donation completion..."
curl -s -X GET "http://localhost:8000/api/donations/requests/$DONATION_ID" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool
echo ""

echo "✅ Complete donation workflow test completed!"
