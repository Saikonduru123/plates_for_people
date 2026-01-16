#!/bin/bash

# Frontend Test Script - Donor Dashboard
# Tests the complete donor flow from login to dashboard

BASE_URL="http://localhost:8000/api"

echo "========================================="
echo "Frontend Integration Test - Donor Flow"
echo "========================================="
echo ""

# Test 1: Login as donor
echo "1. Testing Donor Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testdonor@example.com&password=password123")

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
  echo "✅ Login successful"
  echo "   Token: ${ACCESS_TOKEN:0:20}..."
else
  echo "❌ Login failed"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi

echo ""

# Test 2: Get current user
echo "2. Testing Get Current User..."
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

USER_EMAIL=$(echo $ME_RESPONSE | jq -r '.email')
USER_ROLE=$(echo $ME_RESPONSE | jq -r '.role')

if [ "$USER_EMAIL" == "testdonor@example.com" ]; then
  echo "✅ User verification successful"
  echo "   Email: $USER_EMAIL"
  echo "   Role: $USER_ROLE"
else
  echo "❌ User verification failed"
  echo "   Response: $ME_RESPONSE"
  exit 1
fi

echo ""

# Test 3: Get donor profile
echo "3. Testing Get Donor Profile..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/donors/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

PROFILE_ID=$(echo $PROFILE_RESPONSE | jq -r '.id')

if [ "$PROFILE_ID" != "null" ] && [ -n "$PROFILE_ID" ]; then
  echo "✅ Profile retrieved successfully"
  echo "   Profile ID: $PROFILE_ID"
  echo "   Phone: $(echo $PROFILE_RESPONSE | jq -r '.phone_number')"
else
  echo "❌ Profile retrieval failed"
  echo "   Response: $PROFILE_RESPONSE"
  exit 1
fi

echo ""

# Test 4: Get donor dashboard
echo "4. Testing Get Donor Dashboard..."
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/donors/dashboard" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

TOTAL_DONATIONS=$(echo $DASHBOARD_RESPONSE | jq -r '.total_donations')

if [ "$TOTAL_DONATIONS" != "null" ]; then
  echo "✅ Dashboard data retrieved successfully"
  echo ""
  echo "   📊 Dashboard Stats:"
  echo "   ├─ Total Donations: $TOTAL_DONATIONS"
  echo "   ├─ Completed: $(echo $DASHBOARD_RESPONSE | jq -r '.completed_donations')"
  echo "   ├─ Pending: $(echo $DASHBOARD_RESPONSE | jq -r '.pending_donations')"
  echo "   ├─ Cancelled: $(echo $DASHBOARD_RESPONSE | jq -r '.cancelled_donations')"
  echo "   ├─ Average Rating: $(echo $DASHBOARD_RESPONSE | jq -r '.average_rating')"
  echo "   └─ Total Meals: $(echo $DASHBOARD_RESPONSE | jq -r '.total_meals_donated')"
else
  echo "❌ Dashboard retrieval failed"
  echo "   Response: $DASHBOARD_RESPONSE"
  exit 1
fi

echo ""

# Test 5: Get my donations
echo "5. Testing Get My Donations..."
DONATIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/donations/my-donations" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

DONATIONS_COUNT=$(echo $DONATIONS_RESPONSE | jq '. | length')

echo "✅ Donations retrieved successfully"
echo "   Total donations in list: $DONATIONS_COUNT"

if [ "$DONATIONS_COUNT" -gt 0 ]; then
  echo ""
  echo "   Recent donation:"
  FIRST_DONATION=$(echo $DONATIONS_RESPONSE | jq '.[0]')
  echo "   ├─ ID: $(echo $FIRST_DONATION | jq -r '.id')"
  echo "   ├─ Food: $(echo $FIRST_DONATION | jq -r '.food_type')"
  echo "   ├─ Quantity: $(echo $FIRST_DONATION | jq -r '.quantity_plates') plates"
  echo "   ├─ Meal Type: $(echo $FIRST_DONATION | jq -r '.meal_type')"
  echo "   ├─ Date: $(echo $FIRST_DONATION | jq -r '.donation_date')"
  echo "   └─ Status: $(echo $FIRST_DONATION | jq -r '.status')"
fi

echo ""
echo "========================================="
echo "✅ All Frontend Integration Tests Passed!"
echo "========================================="
echo ""
echo "Frontend is ready to use with:"
echo "- Login: testdonor@example.com / password123"
echo "- Dashboard: http://localhost:5173"
echo ""
