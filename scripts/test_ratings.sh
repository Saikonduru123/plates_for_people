#!/bin/bash

echo "⭐ Testing Rating & Feedback System"
echo "======================================="
echo ""

# Step 1: Complete a donation workflow first
echo "1️⃣  Setting up: Creating and completing a donation..."

# Login as NGO
NGO_LOGIN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testngo@example.com","password":"securepass123"}')
NGO_TOKEN=$(echo $NGO_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

# Login as donor
DONOR_LOGIN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testdonor@example.com","password":"securepass123"}')
DONOR_TOKEN=$(echo $DONOR_LOGIN | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

# Create location
LOCATION=$(curl -s -X POST http://localhost:8000/api/ngos/locations \
  -H "Authorization: Bearer $NGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "location_name": "Rating Test Center",
    "address_line1": "300 Rating St",
    "city": "NYC",
    "state": "NY",
    "zip_code": "10001",
    "country": "USA",
    "latitude": 40.7128,
    "longitude": -74.0060
  }')
LOCATION_ID=$(echo $LOCATION | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

# Set capacity
curl -s -X POST "http://localhost:8000/api/ngos/locations/$LOCATION_ID/capacity" \
  -H "Authorization: Bearer $NGO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-01-27","meal_type":"breakfast","total_capacity":60}' > /dev/null

# Create donation
DONATION=$(curl -s -X POST http://localhost:8000/api/donations/requests \
  -H "Authorization: Bearer $DONOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"ngo_location_id\": $LOCATION_ID,
    \"food_type\": \"Breakfast items\",
    \"quantity_plates\": 25,
    \"meal_type\": \"breakfast\",
    \"donation_date\": \"2026-01-27\",
    \"pickup_time_start\": \"08:00\",
    \"pickup_time_end\": \"09:00\",
    \"description\": \"Fresh breakfast\",
    \"special_instructions\": \"Early pickup preferred\"
  }")
DONATION_ID=$(echo $DONATION | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

# Confirm donation
curl -s -X POST "http://localhost:8000/api/donations/requests/$DONATION_ID/confirm" \
  -H "Authorization: Bearer $NGO_TOKEN" > /dev/null

# Complete donation
curl -s -X POST "http://localhost:8000/api/donations/requests/$DONATION_ID/complete" \
  -H "Authorization: Bearer $NGO_TOKEN" > /dev/null

echo "✅ Donation $DONATION_ID completed"
echo ""

# Step 2: Try to rate before completion (should fail - but we already completed)
echo "2️⃣  Donor creating rating for completed donation..."
RATING=$(curl -s -X POST "http://localhost:8000/api/ratings/" \
  -H "Authorization: Bearer $DONOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"donation_id\": $DONATION_ID,
    \"rating\": 5,
    \"feedback\": \"Excellent service! Very professional and organized. The pickup was smooth and they were very grateful for the donation.\"
  }")

echo $RATING | python3 -m json.tool

RATING_ID=$(echo $RATING | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")

echo ""
echo ""

# Step 3: Try to rate again (should fail - already rated)
echo "3️⃣  Trying to rate the same donation again (should fail)..."
curl -s -X POST "http://localhost:8000/api/ratings/" \
  -H "Authorization: Bearer $DONOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"donation_id\": $DONATION_ID,
    \"rating\": 4,
    \"feedback\": \"Changed my mind\"
  }" | python3 -m json.tool

echo ""
echo ""

# Step 4: Get donor's ratings
echo "4️⃣  Getting all ratings by donor..."
curl -s -X GET "http://localhost:8000/api/ratings/my-ratings" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

# Step 5: Get NGO ratings summary
echo "5️⃣  Getting NGO ratings summary..."
curl -s -X GET "http://localhost:8000/api/ratings/ngo/1" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

# Step 6: Get NGO average rating (lightweight)
echo "6️⃣  Getting NGO average rating..."
curl -s -X GET "http://localhost:8000/api/ratings/ngo/1/average" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

# Step 7: Get rating for specific donation
echo "7️⃣  Getting rating for donation $DONATION_ID..."
curl -s -X GET "http://localhost:8000/api/ratings/donation/$DONATION_ID" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

# Step 8: Search NGOs and see ratings included
echo "8️⃣  Searching NGOs (should now show average rating)..."
curl -s -X GET "http://localhost:8000/api/search/ngos?latitude=40.7128&longitude=-74.0060&radius=10" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for ngo in data['ngos'][:2]:  # Show first 2
    print(f\"NGO: {ngo['ngo_name']}\")
    print(f\"  Location: {ngo['location_name']}\")
    print(f\"  Rating: {ngo.get('average_rating', 'N/A')} ({ngo.get('total_ratings', 0)} ratings)\")
    print()
"

echo ""

# Step 9: Create more ratings with different scores
echo "9️⃣  Creating additional test ratings..."

# Create and complete more donations for variety
for i in {1..3}; do
    # Create new location
    LOC=$(curl -s -X POST http://localhost:8000/api/ngos/locations \
      -H "Authorization: Bearer $NGO_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"location_name\": \"Test Location $i\",
        \"address_line1\": \"$i Main St\",
        \"city\": \"NYC\",
        \"state\": \"NY\",
        \"zip_code\": \"10001\",
        \"country\": \"USA\",
        \"latitude\": 40.7128,
        \"longitude\": -74.0060
      }")
    LOC_ID=$(echo $LOC | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")
    
    # Set capacity
    curl -s -X POST "http://localhost:8000/api/ngos/locations/$LOC_ID/capacity" \
      -H "Authorization: Bearer $NGO_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"date":"2026-01-28","meal_type":"lunch","total_capacity":50}' > /dev/null
    
    # Create donation
    DON=$(curl -s -X POST http://localhost:8000/api/donations/requests \
      -H "Authorization: Bearer $DONOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"ngo_location_id\": $LOC_ID,
        \"food_type\": \"Lunch\",
        \"quantity_plates\": 20,
        \"meal_type\": \"lunch\",
        \"donation_date\": \"2026-01-28\",
        \"pickup_time_start\": \"12:00\",
        \"pickup_time_end\": \"13:00\",
        \"description\": \"Test donation $i\"
      }")
    DON_ID=$(echo $DON | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))")
    
    # Confirm and complete
    curl -s -X POST "http://localhost:8000/api/donations/requests/$DON_ID/confirm" \
      -H "Authorization: Bearer $NGO_TOKEN" > /dev/null
    curl -s -X POST "http://localhost:8000/api/donations/requests/$DON_ID/complete" \
      -H "Authorization: Bearer $NGO_TOKEN" > /dev/null
    
    # Rate with different scores
    RATING_SCORE=$((3 + i))  # Will be 4, 5, 6 (but max 5)
    if [ $RATING_SCORE -gt 5 ]; then
        RATING_SCORE=5
    fi
    
    curl -s -X POST "http://localhost:8000/api/ratings/" \
      -H "Authorization: Bearer $DONOR_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"donation_id\": $DON_ID,
        \"rating\": $RATING_SCORE,
        \"feedback\": \"Test feedback $i - rating $RATING_SCORE stars\"
      }" > /dev/null
    
    echo "  Created rating $i: $RATING_SCORE stars for donation $DON_ID"
done

echo ""
echo ""

# Step 10: Get updated NGO ratings summary with distribution
echo "🔟  Getting updated NGO ratings summary..."
curl -s -X GET "http://localhost:8000/api/ratings/ngo/1?limit=5" \
  -H "Authorization: Bearer $DONOR_TOKEN" | python3 -m json.tool

echo ""
echo ""

echo "✅ Rating system test completed!"
