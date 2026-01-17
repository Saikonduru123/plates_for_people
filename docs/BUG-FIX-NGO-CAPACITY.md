# Bug Fix: NGO Capacity Not Set

## Issue
When submitting a donation request, the backend returned a 400 Bad Request error:
```
Status: 400 Bad Request
Response: {"detail":"NGO has not set capacity for this date and meal type"}
```

## Root Cause
The Chennai NGO (Location ID: 11) had no capacity records in the `ngo_location_capacity` table.

**Why This Happens:**
- NGOs must set their daily capacity for each meal type (breakfast, lunch, dinner)
- This allows the system to track how many donations the NGO can handle
- Without capacity records, the NGO cannot accept donation requests
- This is a business logic requirement to prevent over-committing

## Solution
Added capacity records for the Chennai NGO for the next 30 days.

### Capacity Details Added:
- **Location ID**: 11 (Chennai NGO - Ekkatuthangal)
- **Date Range**: 2026-01-17 to 2026-02-15 (30 days)
- **Meal Types**: Breakfast, Lunch, Dinner
- **Capacity**: 100 plates per meal type per day
- **Total Records**: 90 (30 days × 3 meal types)

### Database Records:
```python
NGOLocationCapacity:
  - location_id: 11
  - date: 2026-01-17, 2026-01-18, ... (30 days)
  - meal_type: breakfast/lunch/dinner
  - total_capacity: 100
  - current_capacity: 100 (initially all available)
```

## How Capacity Works

### Backend Logic:
1. When a donation is created, the backend checks if the NGO has capacity for:
   - The specific date (`donation_date`)
   - The specific meal type (`meal_type`)
   
2. If capacity exists and `current_capacity > 0`:
   - Donation is created with status "pending"
   - Capacity is NOT reduced yet (only when NGO confirms)
   
3. If capacity doesn't exist or is 0:
   - Return 400 error: "NGO has not set capacity for this date and meal type"

### When Capacity is Reduced:
- **On Donation Confirmation** (NGO confirms the request):
  ```python
  current_capacity -= quantity_plates
  ```
- **On Donation Cancellation** (restore capacity):
  ```python
  current_capacity += quantity_plates
  ```

## Testing

### Test Donation Creation:
1. Login as donor: `testdonor@example.com` / `password123`
2. Navigate to Search NGOs → Click Chennai NGO
3. Click "Create Donation Request"
4. Fill out the form:
   - **Meal Type**: breakfast (or lunch/dinner)
   - **Food Type**: idli, dosa, etc.
   - **Quantity**: 50 plates (max 100)
   - **Date**: Any date from 2026-01-17 to 2026-02-15
   - **Time**: e.g., 06:30 - 09:30
5. Submit

**Expected Result**: 
- ✅ Status 201 Created
- ✅ Donation created with status "pending"
- ✅ Navigate to donation details page

### Verify Capacity in Database:
```sql
SELECT * FROM ngo_location_capacity 
WHERE location_id = 11 
ORDER BY date, meal_type 
LIMIT 10;
```

Expected output:
```
Date: 2026-01-17, Meal: breakfast, Available: 100/100
Date: 2026-01-17, Meal: lunch, Available: 100/100
Date: 2026-01-17, Meal: dinner, Available: 100/100
...
```

## For Production

### NGO Dashboard Should Include:
1. **Capacity Management Page** (Not yet implemented):
   - Set daily capacity for each meal type
   - Bulk update capacity for date ranges
   - View current capacity utilization
   - Edit/update existing capacity

2. **Capacity Validation**:
   - Prevent setting capacity in the past
   - Warn when capacity is low
   - Show pending donations vs available capacity

### Example Capacity Management UI:
```
┌─────────────────────────────────────────┐
│ Set Capacity for Location               │
├─────────────────────────────────────────┤
│ Date: [2026-01-17]                      │
│ Meal Type: [Breakfast ▼]                │
│ Capacity: [100 plates]                  │
│                                          │
│ Or set for date range:                  │
│ From: [2026-01-17]                      │
│ To:   [2026-01-31]                      │
│ Apply to: ☑ Breakfast ☑ Lunch ☑ Dinner │
│                                          │
│         [Cancel]    [Save Capacity]     │
└─────────────────────────────────────────┘
```

## Future Enhancements

1. **Auto-generate Capacity**:
   - Generate capacity for next 30/60/90 days automatically when NGO location is created
   - Use default capacity values (e.g., 100 plates per meal)

2. **Recurring Capacity**:
   - Set weekly patterns (e.g., "Every Monday: 100, Tuesday: 150")
   - Holiday scheduling (reduced capacity on holidays)

3. **Smart Capacity**:
   - Suggest capacity based on historical data
   - Warn when over-committing
   - Automatic capacity increase/decrease based on trends

4. **Notifications**:
   - Alert NGO when capacity is running low
   - Notify when capacity needs to be set for upcoming dates

## Files Involved

### Backend:
- `/backend/app/models/ngo.py` - NGOLocationCapacity model
- `/backend/app/routers/donations.py` - Capacity validation logic

### Database:
- Table: `ngo_location_capacity`
- Foreign key: `location_id` → `ngo_locations.id`

## Script Used

```python
# Add capacity for Chennai NGO (Location ID: 11)
from datetime import date, timedelta
from app.models import NGOLocationCapacity
from app.models.ngo import MealType

today = date.today()
for day_offset in range(30):
    current_date = today + timedelta(days=day_offset)
    for meal_type in [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]:
        capacity = NGOLocationCapacity(
            location_id=11,
            date=current_date,
            meal_type=meal_type,
            total_capacity=100,
            current_capacity=100
        )
        session.add(capacity)
session.commit()
```

## Status
✅ **FIXED** - Chennai NGO now has capacity for the next 30 days (Jan 17 - Feb 15, 2026)

## Try It Now!
Your donation submission should now work perfectly! 🎉

The form will accept:
- ✅ Any date from today (Jan 17) to Feb 15, 2026
- ✅ Any meal type (breakfast, lunch, dinner)
- ✅ Up to 100 plates per donation
