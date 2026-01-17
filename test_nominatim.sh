#!/bin/bash

# Test Nominatim Reverse Geocoding API

echo "Testing Nominatim Reverse Geocoding API..."
echo ""

# Test coordinates (Chennai, India)
LAT="13.0827"
LON="80.2707"

echo "Testing with coordinates: $LAT, $LON"
echo ""

# Make request with proper User-Agent
curl -s -H "User-Agent: PlatesForPeople/1.0" \
  "https://nominatim.openstreetmap.org/reverse?format=json&lat=$LAT&lon=$LON&zoom=18&addressdetails=1" \
  | python3 -m json.tool

echo ""
echo "---"
echo ""

# Test with Mumbai coordinates
LAT2="19.0760"
LON2="72.8777"

echo "Testing with coordinates: $LAT2, $LON2 (Mumbai)"
echo ""

curl -s -H "User-Agent: PlatesForPeople/1.0" \
  "https://nominatim.openstreetmap.org/reverse?format=json&lat=$LAT2&lon=$LON2&zoom=18&addressdetails=1" \
  | python3 -m json.tool
