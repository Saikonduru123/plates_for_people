#!/usr/bin/env python3
import requests
import json

# Test login endpoint
url = "http://localhost:8000/api/auth/login"

credentials = {
    "email": "chennai.ngo@example.com",
    "password": "chennai123"
}

print("Testing login...")
print(f"URL: {url}")
print(f"Credentials: {credentials}")
print()

try:
    response = requests.post(url, json=credentials)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print()
    
    if response.status_code == 200:
        print("✅ Login successful!")
        data = response.json()
        print(f"Access Token: {data['access_token'][:50]}...")
        print(f"Token Type: {data['token_type']}")
    else:
        print(f"❌ Login failed!")
        print(f"Response: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("❌ Could not connect to server. Is it running on http://localhost:8000?")
except Exception as e:
    print(f"❌ Error: {e}")
