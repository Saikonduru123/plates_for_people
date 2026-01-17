# 🔑 NGO Login Credentials - WORKING ✅

## Updated: January 17, 2026

All NGO accounts are now **ACTIVE** and **VERIFIED**. You can login immediately!

---

## 🏢 Available NGO Test Accounts

### 1. Test NGO Organization
- **Email:** `testngo@example.com`
- **Password:** `password123`
- **Organization:** Test NGO Organization
- **Registration:** NGO123456
- **Contact:** John Doe
- **Status:** ✅ Verified & Active

### 2. Chennai Food Bank
- **Email:** `chennai.ngo@example.com`
- **Password:** `chennai123`
- **Organization:** Chennai Food Bank
- **Registration:** NGO789012
- **Contact:** Rajesh Kumar
- **Status:** ✅ Verified & Active

### 3. Mumbai Meals Foundation
- **Email:** `mumbai.ngo@example.com`
- **Password:** `mumbai123`
- **Organization:** Mumbai Meals Foundation
- **Registration:** NGO345678
- **Contact:** Priya Sharma
- **Status:** ✅ Verified & Active

---

## 🚀 How to Login

### Via Frontend (http://localhost:5173/login)
1. Open the login page
2. Enter one of the emails above
3. Enter the corresponding password
4. Click "Login"
5. You'll be redirected to the NGO Dashboard

### Via API (Direct)
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chennai.ngo@example.com",
    "password": "chennai123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

---

## ✅ Verification Status

All three NGO accounts have been:
- ✅ Created in the database
- ✅ Passwords hashed and stored securely
- ✅ Verification status set to "verified"
- ✅ Account activated (is_active = true)
- ✅ Email verified (is_verified = true)
- ✅ NGO profiles created with organization details
- ✅ Tested and confirmed working

---

## 🎯 What You Can Do After Login

### NGO Dashboard
- View stats (Total Requests, Pending, Confirmed Today, Total Served)
- See verification status
- Quick actions to all features
- View recent donations

### Manage Donations
- Accept incoming donation requests
- Reject requests with reasons
- Mark donations as complete
- Search and filter donations
- View donor information

### Manage Locations
- Add new pickup/distribution locations
- Edit existing locations
- Delete locations
- Toggle active/inactive status
- Search locations

### Manage Capacity
- Set daily capacity for each location
- View calendar (6 weeks)
- See current bookings
- Navigate between months
- Color-coded capacity status

### View Ratings
- See overall rating (1-5 stars)
- View rating distribution chart
- Read donor feedback
- Filter by rating level
- See donation context

### Profile Settings
- Edit organization name
- Update contact person
- Change phone number
- View verification status
- See registration number (read-only)

---

## 🔧 Troubleshooting

### Issue: "Account not active"
**Solution:** Run the script again to reactivate:
```bash
cd /home/whirldata/whirldata/plates-for-people/backend
python3 create_ngo_users.py
```

### Issue: "Invalid credentials"
**Solution:** The passwords are:
- testngo@example.com → `password123`
- chennai.ngo@example.com → `chennai123`
- mumbai.ngo@example.com → `mumbai123`

Make sure you're typing them exactly as shown (case-sensitive).

### Issue: "Backend not running"
**Solution:** Start the backend server:
```bash
cd /home/whirldata/whirldata/plates-for-people/backend
source ../.venv/bin/activate
uvicorn app.main:app --reload
```

### Issue: "Frontend not running"
**Solution:** Start the frontend server:
```bash
cd /home/whirldata/whirldata/plates-for-people/frontend/plates-for-people
npm run dev
```

---

## 📝 Additional Test Users

### Donor Account
- **Email:** `testdonor@example.com`
- **Password:** `password123`
- **Role:** Donor

### Admin Account
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** Admin

---

## 🎉 Success!

All NGO accounts are ready to use! Login and explore the complete NGO management interface with 6 features:
1. ✅ NGO Dashboard
2. ✅ Manage Donations
3. ✅ Manage Locations
4. ✅ Manage Capacity
5. ✅ View Ratings
6. ✅ Profile Settings

**Enjoy testing the NGO flow!** 🚀

---

**Last Updated:** January 17, 2026  
**Status:** ✅ All accounts active and verified  
**Tested:** ✅ Login confirmed working
