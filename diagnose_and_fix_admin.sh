#!/bin/bash
set -e

echo "======================================"
echo "🔍 ADMIN LOGIN DIAGNOSTIC & FIX"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Backend running
echo "1️⃣  Checking backend..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    echo "   Starting backend..."
    cd /home/whirldata/plates_for_people/backend
    pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
    sleep 2
    nohup ./venv/bin/uvicorn --app-dir /home/whirldata/plates_for_people/backend --env-file /home/whirldata/plates_for_people/backend/.env app.main:app --host 0.0.0.0 --port 8000 >/tmp/plates_backend.log 2>&1 &
    echo "   Waiting 5 seconds..."
    sleep 5
fi

echo ""
echo "2️⃣  Checking database for admin user..."

# Check and fix admin user
cd /home/whirldata/plates_for_people/backend
source venv/bin/activate

python3 << 'PYEOF'
from passlib.context import CryptContext
import psycopg2
import sys

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

try:
    conn = psycopg2.connect(
        host='127.0.0.1',
        database='plates_for_people',
        user='postgres',
        password='Newborn@123'
    )
    cur = conn.cursor()
    
    # Check for admin user
    cur.execute("SELECT id, email, role, is_active, is_verified, password_hash FROM users WHERE email = 'admin@platesforpeople.org'")
    result = cur.fetchone()
    
    if result:
        admin_id, email, role, is_active, is_verified, old_hash = result
        print(f"   Found admin user:")
        print(f"     ID: {admin_id}")
        print(f"     Email: {email}")
        print(f"     Role: {role}")
        print(f"     Active: {is_active}")
        print(f"     Verified: {is_verified}")
        
        # Ensure password is correct and status is active
        new_hash = pwd_context.hash('admin123')
        cur.execute("""
            UPDATE users 
            SET password_hash = %s, 
                is_active = true, 
                is_verified = true,
                role = 'ADMIN'
            WHERE email = 'admin@platesforpeople.org'
        """, (new_hash,))
        conn.commit()
        print(f"   ✅ Updated admin user")
        
    else:
        print("   Admin user NOT found. Creating...")
        new_hash = pwd_context.hash('admin123')
        cur.execute("""
            INSERT INTO users (email, password_hash, role, is_active, is_verified, created_at)
            VALUES (%s, %s, 'ADMIN', true, true, NOW())
            RETURNING id
        """, ('admin@platesforpeople.org', new_hash))
        admin_id = cur.fetchone()[0]
        conn.commit()
        print(f"   ✅ Created admin user with ID: {admin_id}")
    
    # Verify password works
    cur.execute("SELECT password_hash FROM users WHERE email = 'admin@platesforpeople.org'")
    stored_hash = cur.fetchone()[0]
    
    if pwd_context.verify('admin123', stored_hash):
        print("   ✅ Password verification successful")
    else:
        print("   ❌ Password verification FAILED")
        sys.exit(1)
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"   ❌ Database error: {e}")
    sys.exit(1)
PYEOF

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to setup admin user${NC}"
    exit 1
fi

echo ""
echo "3️⃣  Testing login API..."

LOGIN_RESULT=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@platesforpeople.org","password":"admin123"}')

if echo "$LOGIN_RESULT" | grep -q "access_token"; then
    echo -e "${GREEN}✅ Login API works!${NC}"
    
    # Extract token
    TOKEN=$(echo "$LOGIN_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)
    
    if [ -n "$TOKEN" ]; then
        echo ""
        echo "4️⃣  Testing /me endpoint..."
        ME_RESULT=$(curl -s http://localhost:8000/api/auth/me -H "Authorization: Bearer $TOKEN")
        
        echo "   Response from /me:"
        echo "$ME_RESULT" | python3 -m json.tool 2>/dev/null | sed 's/^/     /'
        
        ROLE=$(echo "$ME_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('role', 'unknown'))" 2>/dev/null)
        
        if [ "$ROLE" = "admin" ]; then
            echo -e "${GREEN}   ✅ Role is correct: 'admin'${NC}"
        else
            echo -e "${RED}   ❌ Role is wrong: '$ROLE' (expected 'admin')${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Login failed${NC}"
    echo "   Response: $LOGIN_RESULT"
    exit 1
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
echo "======================================"
echo ""
echo "🔐 Admin Credentials:"
echo "   Email: admin@platesforpeople.org"
echo "   Password: admin123"
echo ""
echo "🌐 Login URL:"
echo "   http://localhost:5173/login"
echo "   (or http://localhost:5174/login)"
echo ""
echo "💡 If frontend still doesn't work:"
echo "   1. Open browser DevTools (F12)"
echo "   2. Go to Console tab"
echo "   3. Run: localStorage.clear()"
echo "   4. Refresh page (Ctrl+F5)"
echo "   5. Try login again"
echo ""
