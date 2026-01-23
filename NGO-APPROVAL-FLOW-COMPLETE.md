# NGO Approval Login Flow - COMPLETE

## Overview

The NGO approval system prevents unapproved NGOs from logging in. Only after an admin approves an NGO in the "Verify NGOs" page can that NGO user successfully log in.

---

## System Flow

### 1. NGO Registration (Backend)

- NGO registers with email and password
- User is created with `role = "ngo"` and `is_active = false`
- NGO Profile is created with `verification_status = "pending"`
- NGO cannot login at this stage

### 2. Attempted NGO Login (Before Approval)

**File**: `/backend/app/routers/auth.py` (Lines 131-200)

**Validation Checks**:

```python
1. Email/Password verification ✓
2. Account active check → FAILS if is_active = false
3. NGO profile exists check → Must exist
4. Verification status check → FAILS if NOT "verified"
```

**Error Response (403 Forbidden)**:

```json
{
  "detail": "Your NGO account is pending. Please wait for admin approval."
}
```

### 3. Admin Verify NGOs Page

**File**: `/frontend/plates-for-people/src/pages/admin/VerifyNGOs.tsx`

**Three Tabs**:

1. **Pending** - NGOs awaiting approval (Approve/Reject buttons)
2. **Approved** - Already verified NGOs (read-only)
3. **Rejected** - Rejected NGOs (read-only)

### 4. Admin Approves NGO

**Frontend**: Click "Approve" button on Pending tab
**API Call**: `POST /admin/ngos/{ngoId}/verify`

**Backend Processing** (`/admin.py` Lines 210-240):

```python
1. Find NGO profile by ID
2. Check if status = "pending"
3. Update verification_status = "verified"
4. Set verified_at timestamp
5. Set verified_by (admin ID)
6. Activate user account (is_active = true)
7. Create notification for NGO
8. Commit to database
```

### 5. NGO Login After Approval

**All Validation Checks Pass** ✓

```python
1. Email/Password verified ✓
2. is_active = true ✓
3. NGO profile exists ✓
4. verification_status = "verified" ✓
```

**Success Response**:

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

NGO now accesses dashboard and can manage donations

---

## API Endpoints

### Approve NGO

```
POST /api/admin/ngos/{ngoId}/verify
Response: NGOProfile (with verification_status = "verified")
```

### Reject NGO

```
POST /api/admin/ngos/{ngoId}/reject?rejection_reason="reason"
Response: NGOProfile (with verification_status = "rejected")
```

### Get All NGOs (with filter)

```
GET /api/admin/ngos/all?status=pending
GET /api/admin/ngos/all?status=verified
GET /api/admin/ngos/all?status=rejected
```

### Login (NGO)

```
POST /api/auth/login
Body: { "email": "ngo@example.com", "password": "password" }

Success (Approved): Returns tokens
Failure (Not Approved): 403 Forbidden - "Your NGO account is pending"
```

---

## Verification Status Enum

**Values**: `pending` | `verified` | `rejected`

- **pending**: New NGO awaiting admin review (cannot login)
- **verified**: Admin approved (can login)
- **rejected**: Admin rejected (cannot login, with rejection reason)

---

## Testing the Flow

### Test Scenario 1: NGO Cannot Login Without Approval

1. Create NGO account (registration endpoint)
2. Try to login with NGO credentials
3. ✓ Should get: `403 - "Your NGO account is pending"`

### Test Scenario 2: Admin Approves NGO

1. Go to Admin → Verify NGOs
2. Find pending NGO in "Pending" tab
3. Click "Approve" button
4. ✓ NGO moves to "Approved" tab
5. Notification sent to NGO user

### Test Scenario 3: NGO Login After Approval

1. NGO user tries login again
2. ✓ Login successful
3. Access token issued
4. NGO Dashboard loads

### Test Scenario 4: Admin Rejects NGO

1. Go to Admin → Verify NGOs
2. Find pending NGO in "Pending" tab
3. Click "Reject" button
4. Enter rejection reason
5. ✓ NGO moves to "Rejected" tab
6. NGO cannot login (verification_status = rejected)

---

## Database Schema

### User Table

- `id`: Primary key
- `email`: User email
- `password_hash`: Hashed password
- `role`: "admin" | "ngo" | "donor"
- `is_active`: true | false (activated after approval)

### NGOProfile Table

- `id`: Primary key
- `user_id`: Foreign key to User
- `organization_name`: NGO name
- `verification_status`: "pending" | "verified" | "rejected"
- `verified_at`: Timestamp when approved
- `verified_by`: Admin user ID who approved
- `rejection_reason`: Reason if rejected

---

## Key Files

| File                                       | Purpose                                   |
| ------------------------------------------ | ----------------------------------------- |
| `/backend/app/routers/auth.py`             | Login endpoint with verification check    |
| `/backend/app/routers/admin.py`            | Approve/Reject endpoints                  |
| `/frontend/src/pages/admin/VerifyNGOs.tsx` | Admin verification UI with tabs           |
| `/frontend/src/services/adminService.ts`   | API calls (approveNGO, rejectNGO)         |
| `/backend/app/models.py`                   | NGOProfile model with verification_status |

---

## Status: ✅ COMPLETE

The NGO approval login flow is fully implemented and functioning:

- ✅ NGO registration creates pending profile
- ✅ Login blocked for non-approved NGOs
- ✅ Admin can approve/reject in Verify NGOs page
- ✅ Approved NGOs can login successfully
- ✅ Rejection reasons stored and displayed
- ✅ Notifications sent on approval/rejection
