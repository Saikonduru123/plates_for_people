#!/bin/bash

echo "🔔 Testing Notification System"
echo "======================================="
echo ""

# Step 1: Login as NGO
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

# Step 2: Login as donor
echo "2️⃣  Logging in as donor..."
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

# Step 3: NGO creates location
echo "3️⃣  Creating NGO location..."
LOCATION=$(curl -s -X POST http://localhost:8000/api/ngos/locations \
  -H "Authorization: Bearer $NGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location_name": "Test Notification Center",
    "address_line1": "200 Test St",
    "address_line2": "Floor 3",
    "city": "Boston",
    "state": "MA",
    "zip_code": "02101",
    "country": "USA",
    "latitude": 42.3601,
    "longitude": -71.0589
  }')

LOCATION_ID=$(echo $LOCATION | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

echo "Location ID: $LOCATION_ID"
echo ""

# Step 4: Set capacity
echo "4️⃣  Setting capacity..."
curl -s -X POST "http://localhost:8000/api/ngos/locations/$LOCATION_ID/capacity" \
  -H "Authorization: Bearer $NGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-26",
    "meal_type": "dinner",
    "total_capacity": 80
  }' | python3 -m json.tool

echo ""

# Step 5: Donor creates donation (should create notification for NGO)
echo "5️⃣  Donor creating donation..."
DONATION=$(curl -s -X POST http://localhost:8000/api/donations/requests \
  -H "Authorization: Bearer $DONOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"ngo_location_id\": $LOCATION_ID,
    \"food_type\": \"Italian cuisine\",
    \"quantity_plates\": 30,
    \"meal_type\": \"dinner\",
    \"donation_date\": \"2026-01-26\",
    \"pickup_time_start\": \"18:00\",
    \"pickup_time_end\": \"19:00\",
    \"description\": \"Fresh pasta and pizza\",
    \"special_instructions\": \"Keep hot\"
  }")

DONATION_ID=$(echo $DONATION | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

echo "Donation ID: $DONATION_ID"
echo ""

# Step 6: NGO checks notifications (should see new donation notification)
echo "6️⃣  NGO checking notifications..."
curl -s -X GET "http://localhost:8000/api/notifications/" \
  -H "Authorization: Bearer $NGO_TOKEN" | python3 -m json.tool

echo ""

# Step 7: NGO confirms donation (should create notification for donor)
echo "7️⃣  NGO confirming donation..."
curl -s -X POST "http://localhost:8000/api/donations/requests/$DONATION_ID/confirm" \
  -H "Authorization: Bearer $NGO_TOKEN" | python3 -m json.tool

echo ""

# Step 8: Donor checks notifications (should see confirmation notification)
echo "8️⃣  Donor checking notifications..."
DONOR_NOTIFICATIONS=$(curl -s -X GET "http://localhost:8000/api/notifications/" \
  -H "Authorization: Bearer $DONOR_TOKEN")

echo $DONOR_NOTIFICATIONS | python3 -m json.tool

echo ""

# Step 9: Get unread count
echo "9️⃣  Getting donor's unread notifications..."
curl -s -X GET "http://localhost:8000/api/notifications/unread" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""

# Step 10: Mark notification as read
FIRST_NOTIF_ID=$(echo $DONOR_NOTIFICATIONS | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['notifications'][0]['id'] if data.get('notifications') else '')")

if [ -n "$FIRST_NOTIF_ID" ]; then
    echo "🔟  Marking notification $FIRST_NOTIF_ID as read..."
    curl -s -X PUT "http://localhost:8000/api/notifications/$FIRST_NOTIF_ID/read" \
      -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool
    echo ""
fi

# Step 11: NGO marks donation complete (should create completion notification)
echo "1️⃣1️⃣  NGO marking donation as complete..."
curl -s -X POST "http://localhost:8000/api/donations/requests/$DONATION_ID/complete" \
  -H "Authorization: Bearer $NGO_TOKEN" | python3 -m json.tool

echo ""

# Step 12: Donor checks final notifications
echo "1️⃣2️⃣  Donor checking final notifications..."
curl -s -X GET "http://localhost:8000/api/notifications/" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""

# Step 13: Mark all as read
echo "1️⃣3️⃣  Donor marking all notifications as read..."
curl -s -X PUT "http://localhost:8000/api/notifications/read-all" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""

echo "✅ Notification system test completed!"
