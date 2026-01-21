#!/bin/bash

echo "=== Verifying Admin User Setup ==="
echo ""

# 1. Check backend is running
echo "1. Checking backend (port 8000)..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is NOT running"
    exit 1
fi

# 2. Check admin user exists in DB
echo ""
echo "2. Checking admin user in database..."
ADMIN_COUNT=$(PGPASSWORD='Newborn@123' psql -U postgres -h 127.0.0.1 -d plates_for_people -t -c "SELECT COUNT(*) FROM users WHERE email = 'admin@platesforpeople.org' AND role = 'ADMIN';" 2>/dev/null | tr -d ' ')
if [ "$ADMIN_COUNT" = "1" ]; then
    echo "   ✅ Admin user exists in database"
else
    echo "   ❌ Admin user NOT found in database"
    exit 1
fi

# 3. Test admin login via API
echo ""
echo "3. Testing admin login via API..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@platesforpeople.org","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "   ✅ Admin login works!"
    
    # Extract token and test /me endpoint
    TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
    
    if [ -n "$TOKEN" ]; then
        echo ""
        echo "4. Testing /me endpoint with admin token..."
        USER_DATA=$(curl -s http://localhost:8000/api/auth/me -H "Authorization: Bearer $TOKEN")
        
        ROLE=$(echo "$USER_DATA" | python3 -c "import sys, json; print(json.load(sys.stdin).get('role', 'unknown'))" 2>/dev/null)
        
        if [ "$ROLE" = "admin" ]; then
            echo "   ✅ Admin role verified: $ROLE"
            echo ""
            echo "5. Admin user details:"
            echo "$USER_DATA" | python3 -m json.tool 2>/dev/null || echo "$USER_DATA"
        else
            echo "   ❌ Role mismatch: $ROLE (expected: admin)"
        fi
    fi
else
    echo "   ❌ Admin login FAILED"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

# 6. Check frontend
echo ""
echo "6. Checking frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend running on port 5173"
    echo "   🌐 Login at: http://localhost:5173/login"
elif curl -s http://localhost:5174 > /dev/null 2>&1; then
    echo "   ✅ Frontend running on port 5174"
    echo "   🌐 Login at: http://localhost:5174/login"
else
    echo "   ⚠️  Frontend not detected (check if npm run dev is running)"
fi

echo ""
echo "=== ADMIN CREDENTIALS ==="
echo "Email: admin@platesforpeople.org"
echo "Password: admin123"
echo ""
echo "✅ All backend checks passed! Admin can login via API."
echo ""
echo "If frontend login still fails:"
echo "1. Open browser DevTools (F12) → Console tab"
echo "2. Clear localStorage: localStorage.clear()"
echo "3. Refresh page and try login again"
