#!/bin/bash

echo "🔧 Creating Admin User"
echo "====================="
echo ""

# Register admin user
echo "Creating admin account..."
curl -s -X POST http://localhost:8000/api/auth/register/donor \
  -H "Content-Type: application/json" \
  -d '{
    "user_data": {
      "email": "admin@platesforpeople.org",
      "password": "admin123",
      "role": "admin"
    },
    "profile_data": {
      "organization_name": "Platform Admin",
      "contact_person": "Admin User",
      "phone": "+1234567890",
      "address_line1": "123 Admin St",
      "city": "New York",
      "state": "NY",
      "zip_code": "10001",
      "country": "USA",
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }' | python3 -m json.tool

echo ""
echo "✅ Admin user created!"
echo "   Email: admin@platesforpeople.org"
echo "   Password: admin123"
