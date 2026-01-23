# NGO Current Flow - Complete

## 1. NGO Registration Flow

```
User selects "NGO" role
    ↓
Register page with NGO fields
    ↓
Submit registration
    ↓
Account created but is_active = false
    ↓
Cannot login - shows "Account not active. Please wait for admin verification."
    ↓
Admin verifies NGO in /admin/verify-ngos
    ↓
Admin clicks "Approve" → Account activated (is_active = true)
    ↓
NGO receives verification notification
    ↓
NGO can now login
```

## 2. NGO Dashboard (/ngo/dashboard)

Main landing page after login

- Shows statistics:
  - Total donation requests
  - Pending requests
  - Completed requests
  - Average rating
  - Total plates received
  - Recent requests list
- Quick action cards:
  - 📋 Manage Locations
  - 📊 Manage Capacity
  - 📋 View Requests
  - ⭐ View Ratings

## 3. NGO Donations (/ngo/donations)

View and manage donation requests

- **Pending Requests**: Donations offered by donors, waiting for NGO response
  - Can CONFIRM or REJECT
  - Shows donor info, food type, quantity, timing
- **Recent Requests**: History of all donations (pending, completed, rejected)
- **Donation Details** (/ngo/donation/:id):
  - Full donation information
  - Donor contact details
  - Action buttons (Confirm/Reject)

## 4. NGO Locations (/ngo/locations)

Manage physical distribution locations

- **List Locations**: All NGO branches/centers
  - View location details
  - Edit location
  - Delete location
  - Shows capacity info
- **Add Location** (/ngo/locations/add):
  - Enter location name
  - Address (line 1, 2, city, state, zip)
  - Coordinates (latitude, longitude)
  - Contact person & phone
  - Operating hours (optional)
- **Edit Location** (/ngo/locations/edit/:id):
  - Update location details
  - Update coordinates
  - Enable/disable location

## 5. NGO Manage Capacity (/ngo/capacity)

Manage daily capacity at each location

- **View capacity by date**:
  - Max capacity per location
  - Current bookings
  - Available capacity
  - Special notes
- **Add/Update capacity**:
  - Select location
  - Select date
  - Enter max capacity
  - Add special instructions

## 6. NGO View Ratings (/ngo/ratings)

View feedback from donors

- Shows ratings received (1-5 stars)
- Donor comments
- Date of donation
- Filter by rating

## 7. NGO Profile Settings (/ngo/profile)

Edit NGO information

- Organization name
- Registration number
- Contact person
- Phone number
- Verification document (read-only after submission)
- Update profile button

---

## Request Flow: Donor → NGO

### Donor Side (Send Donation)

```
Donor searches NGOs → Views NGO details → Selects location → Offers donation
```

### NGO Side (Receive Request)

```
1. Donation appears in /ngo/donations (Pending Requests)
2. NGO reviews: Food type, quantity, pickup time, donor info
3. NGO chooses:
   - CONFIRM → Donation moves to "Recent" with "confirmed" status
   - REJECT → Request is rejected with reason
```

### After Confirmation

```
NGO member picks up donation
   ↓
NGO marks as COMPLETED
   ↓
Donor can rate the donation
   ↓
Rating appears in NGO's /ngo/ratings
```

---

## Authentication Flow

1. NGO registers → Pending admin approval
2. Admin approves → NGO can login
3. Login checks: `user.role == 'ngo' && user.is_active == false` → Blocked
4. Login checks: `user.role == 'ngo' && user.is_active == true` → Allowed
5. NGO access token issued → Can access all /ngo/\* routes

---

## Key Data Models

### NGO Profile

- organization_name
- registration_number
- contact_person
- phone
- verification_status (pending/verified/rejected)
- verified_at (timestamp)
- verified_by (admin user ID)
- rejection_reason (if rejected)
- user_id (linked to User account)

### NGO Location

- location_name
- address (line1, line2, city, state, zip)
- coordinates (latitude, longitude)
- contact_person
- contact_phone
- operating_hours
- is_active
- ngo_id (linked to NGO)

### NGO Location Capacity

- location_id
- date
- max_capacity
- current_bookings
- available_capacity
- notes

---

## Current Features Implemented ✅

- ✅ NGO Registration
- ✅ Admin NGO Verification (Approve/Reject)
- ✅ NGO Login (after admin verification)
- ✅ NGO Dashboard with statistics
- ✅ Manage Locations (CRUD)
- ✅ Manage Capacity
- ✅ View Donation Requests
- ✅ Confirm/Reject Donations
- ✅ View Ratings
- ✅ Profile Settings
- ✅ Notifications for NGO events

---

## Missing/In Progress

- 🔄 Donation completion marking
- 🔄 Advanced filtering options
- 🔄 Bulk operations
