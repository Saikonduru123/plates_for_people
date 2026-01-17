# Bug Fix: Donation API Endpoint Mismatch

## Issue
When submitting a donation request, the frontend was getting a 404 Not Found error:
```
POST http://localhost:8000/api/donations/
Status: 404 Not Found
Response: {"detail":"Not Found"}
```

## Root Cause
**Frontend** was calling: `/api/donations/`  
**Backend** endpoint is: `/api/donations/requests`

The backend router uses `/requests` as the endpoint path:
```python
# backend/app/routers/donations.py
@router.post("/requests", status_code=status.HTTP_201_CREATED)
async def create_donation_request(...)
```

And it's registered with prefix `/api/donations`:
```python
# backend/app/main.py
app.include_router(donations.router, prefix="/api/donations", tags=["Donations"])
```

**Full URL**: `/api/donations/requests` ✅

## Solution
Updated all donation service endpoints in `donationService.ts` to include `/requests`:

### Updated Endpoints:

| Operation | Old URL | New URL (Fixed) |
|-----------|---------|-----------------|
| Create | `/donations/` | `/donations/requests` ✅ |
| Get by ID | `/donations/{id}` | `/donations/requests/{id}` ✅ |
| My Donations | `/donations/my-donations` | `/donations/requests/my-donations` ✅ |
| NGO Requests | `/donations/ngo-requests` | `/donations/requests/ngo-requests` ✅ |
| Complete | `/donations/{id}/complete` | `/donations/requests/{id}/complete` ✅ |
| Cancel | `/donations/{id}/cancel` | `/donations/requests/{id}/cancel` ✅ |
| Update Status | `/donations/{id}/status` | `/donations/requests/{id}/status` ✅ |
| Delete | `/donations/{id}` | `/donations/requests/{id}` ✅ |

## Files Modified
1. **frontend/plates-for-people/src/services/donationService.ts**
   - Updated all 8 endpoint URLs
   - Added `/requests` after `/donations/` for all methods

## Testing
To test the fix:
1. Login as donor: `testdonor@example.com` / `password123`
2. Navigate to Search NGOs → Select Chennai NGO
3. Click "Create Donation Request"
4. Fill out the 4-step form with valid data:
   - Meal type: breakfast/lunch/dinner
   - Food type: e.g., "idli"
   - Quantity: e.g., 50 plates
   - Date: Today or future date
   - Time: e.g., 06:30 - 09:30
5. Submit

**Expected Result**: 
- ✅ Status 201 Created
- ✅ Navigate to donation details page
- ✅ Success toast notification

## Verification
```bash
# Check backend route definition
curl http://localhost:8000/api/docs
# Look for POST /api/donations/requests

# Test create donation (with auth token)
curl -X POST http://localhost:8000/api/donations/requests \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "ngo_location_id": 11,
    "meal_type": "breakfast",
    "food_type": "idli",
    "quantity_plates": 50,
    "donation_date": "2026-01-28",
    "pickup_time_start": "06:30",
    "pickup_time_end": "09:30",
    "description": "enjoy",
    "special_instructions": "enjoy"
  }'
```

## Status
✅ **FIXED** - All donation endpoints now correctly point to `/api/donations/requests/*`

## Related
- Backend: `/backend/app/routers/donations.py`
- Backend: `/backend/app/main.py` (router registration)
- Frontend: `/frontend/plates-for-people/src/services/donationService.ts`
