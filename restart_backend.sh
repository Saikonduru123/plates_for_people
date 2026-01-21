#!/bin/bash
echo "Stopping backend..."
pkill -f "uvicorn.*app.main:app"
sleep 2

echo "Starting backend..."
cd /home/whirldata/plates_for_people/backend
nohup ./venv/bin/uvicorn --app-dir /home/whirldata/plates_for_people/backend --env-file /home/whirldata/plates_for_people/backend/.env app.main:app --host 0.0.0.0 --port 8000 >/tmp/plates_backend.log 2>&1 &

echo "Waiting for backend to start..."
sleep 4

echo "Testing backend..."
curl -s http://localhost:8000/health | python3 -m json.tool

echo ""
echo "Testing admin login..."
curl -s -X POST http://localhost:8000/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@platesforpeople.org","password":"admin123"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✅ Login successful!' if 'access_token' in d else '❌ Login failed')"

echo ""
echo "✅ Backend restarted!"
echo "Admin credentials:"
echo "  Email: admin@platesforpeople.org"
echo "  Password: admin123"
