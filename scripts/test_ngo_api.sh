#!/bin/bash
# Test notification API for NGO user

echo "=== Testing Notification API ==="
echo ""

# Get NGO email first
echo "Step 1: Finding NGO users..."
cd /home/whirldata/plates_for_people/backend
python3 << 'EOF'
from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres:postgres@localhost/plates_for_people')
with engine.connect() as conn:
    result = conn.execute(text("SELECT u.id, u.email, np.organization_name FROM users u JOIN ngo_profiles np ON u.id = np.user_id WHERE u.role = 'ngo' ORDER BY u.id DESC LIMIT 3"))
    print("\nAvailable NGO accounts:")
    for r in result:
        print(f"  - Email: {r[1]}, Org: {r[2]}, User ID: {r[0]}")
EOF

echo ""
echo "Step 2: Login with NGO credentials and get token"
echo "Enter NGO email: "
read NGO_EMAIL
echo "Enter password (default: password123): "
read -s PASSWORD
PASSWORD=${PASSWORD:-password123}

# Login to get token
echo ""
echo "Logging in..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$NGO_EMAIL\", \"password\":\"$PASSWORD\"}")

TOKEN=$(echo $TOKEN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))")

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed. Response:"
    echo "$TOKEN_RESPONSE"
    exit 1
fi

echo "✅ Login successful!"
echo ""

# Get notifications
echo "Step 3: Fetching notifications..."
NOTIF_RESPONSE=$(curl -s -X GET http://localhost:8000/notifications/unread \
  -H "Authorization: Bearer $TOKEN")

echo "$NOTIF_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"Total notifications: {data.get('total', 0)}\")
print(f\"Unread count: {data.get('unread_count', 0)}\")
print(\"\nNotifications:\")
for n in data.get('notifications', []):
    print(f\"  - {n.get('title')}: {n.get('message')}\")
"

echo ""
echo "=== Raw Response ==="
echo "$NOTIF_RESPONSE" | python3 -m json.tool
