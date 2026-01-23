# NGO "Set Capacity" Feature - Exact Current Flow

## Overview

The "Set Capacity" feature allows NGOs to define the maximum number of food donations their locations can accept for each future date. The system uses a calendar interface with capacity indicators showing utilization levels.

---

## Step-by-Step User Flow

### 1. **Access Manage Capacity Page**

- **User Action:** NGO clicks "Manage Capacity" in dashboard or navigates to `/ngo/capacity`
- **Route:** `/ngo/capacity` → `ManageCapacity.tsx`
- **Initial State:**
  - Component checks if NGO has any active locations
  - If no locations exist: Shows empty state with message "You need to have at least one active location"
  - If locations exist: Loads locations dropdown

### 2. **Select Location**

- **UI Component:** `IonSelect` dropdown showing all NGO's locations
- **Default:** First location is pre-selected (if available)
- **Action:** NGO selects a location from dropdown
- **Effect:**
  - Sets `selectedLocationId` state
  - Triggers `loadCapacityData()` to fetch existing capacity for selected location

**Backend Call:**

```
GET /ngos/locations/{location_id}/capacity
```

- Returns all capacity records for the selected location across all dates
- Response includes: `date`, `max_capacity`, `current_bookings`, `notes`

### 3. **View Calendar**

- **Calendar Display:**
  - Shows current month by default
  - Displays previous/next month days with reduced opacity
  - Today's date is highlighted with special styling
  - Previous dates are grayed out (cannot be clicked)

- **Navigation Controls:**
  - ◀ Previous Month button
  - Month/Year title (e.g., "January 2025")
  - ▶ Next Month button
  - "Today" quick button

- **Capacity Indicators:**
  - Each date shows color-coded capacity bar if capacity is set:
    - **Not Set** (Gray): No capacity defined for this date
    - **Low** (Green): < 50% utilization
    - **Medium** (Yellow): 50-80% utilization
    - **High** (Orange): 80-100% utilization
    - **Full** (Red): 100% or more utilized
  - Display shows: `current_bookings / max_capacity` (e.g., "5/10")

### 4. **Select Future Date**

- **User Action:** NGO clicks on any future date in the calendar
- **Validation:**
  - Cannot click past dates (today or earlier)
  - If past date clicked: Shows toast message "Cannot set capacity for past dates"
  - Must click dates within current month view (other month dates ignored)

- **What Happens:**
  - Date is set as `selectedDay`
  - Modal opens with title:
    - "Set Capacity" (if no existing capacity for date)
    - "Update Capacity" (if capacity already exists)
  - Pre-fills form with:
    - Date display: Full formatted date (e.g., "Tuesday, January 20, 2025")
    - `max_capacity`: Existing value or 0
    - `notes`: Existing value or empty
    - If updating: Shows current bookings count

### 5. **Fill Capacity Form (Modal)**

- **Modal Layout:**

  ```
  ┌─────────────────────────────────────┐
  │ Set Capacity            [Close]     │
  ├─────────────────────────────────────┤
  │                                     │
  │ 📅 Tuesday, January 20, 2025        │
  │                                     │
  │ (if updating)                       │
  │ 👥 Current Bookings: 5              │
  │                                     │
  │ Maximum Capacity *                  │
  │ [________] (number input)           │
  │ Max donations this location can     │
  │ accept on this date                 │
  │                                     │
  │ Notes                               │
  │ [____________] (textarea, 3 rows)   │
  │ Optional notes (e.g., special       │
  │ events, holidays)                   │
  │                                     │
  │ [✓ Set Capacity] (or Update)        │
  │                                     │
  └─────────────────────────────────────┘
  ```

- **Form Fields:**
  - **Maximum Capacity** (Required, min=1):
    - Type: Number input
    - Validation: Must be > 0
    - Error if empty or ≤ 0: "Capacity must be greater than 0"
    - Represents: Max number of donations location can receive on this date
  - **Notes** (Optional):
    - Type: Textarea (3 rows)
    - Free text field
    - Example uses: "Holiday closure", "Special event", "Temperature control maintenance"

### 6. **Submit Capacity (Two Scenarios)**

#### Scenario A: **Setting New Capacity** (First time for this date)

- **User Action:** Fills max_capacity + optional notes, clicks "Set Capacity"
- **Frontend Validation:**
  - Checks: `max_capacity > 0`
  - If invalid: Shows "Capacity must be greater than 0" toast
  - Prevents submission if validation fails

- **Backend Request:**

  ```
  POST /ngos/locations/{location_id}/capacity
  Content-Type: application/json

  {
    "date": "2025-01-20",
    "max_capacity": 10,
    "notes": "Regular capacity"
  }
  ```

- **Backend Processing:**
  - Verifies location belongs to current NGO
  - Checks if capacity already exists for this date (error if it does)
  - Creates new `NGOLocationCapacity` record:
    ```
    NGOLocationCapacity(
      location_id = selected_location,
      date = "2025-01-20",
      max_capacity = 10,
      current_bookings = 0,  // Initially empty
      notes = "Regular capacity",
      created_at = now
    )
    ```
  - Returns created capacity record

- **Response:**
  ```
  {
    "id": 42,
    "location_id": 5,
    "date": "2025-01-20",
    "max_capacity": 10,
    "current_bookings": 0,
    "notes": "Regular capacity",
    "created_at": "2025-01-15T10:30:00Z"
  }
  ```

#### Scenario B: **Updating Existing Capacity** (Date already has capacity set)

- **User Action:** Date already has capacity, user clicks it, modal shows "Update Capacity"
- **Form Pre-fill:**
  - `max_capacity`: Current value (e.g., 10)
  - `current_bookings`: Shown as read-only display (e.g., "5")
  - `notes`: Current notes if any

- **User Modifies:** Changes max_capacity and/or notes

- **Backend Request:**

  ```
  PUT /ngos/locations/{location_id}/capacity/{capacity_id}
  Content-Type: application/json

  {
    "max_capacity": 15,
    "notes": "Increased for special event"
  }
  ```

- **Backend Processing:**
  - Verifies location belongs to NGO
  - Verifies capacity record exists
  - Updates fields:
    ```
    capacity.max_capacity = 15
    capacity.notes = "Increased for special event"
    capacity.updated_at = now
    ```
  - Preserves `current_bookings` (bookings from donations, not changed by NGO)
  - Returns updated record

### 7. **Success & Modal Closes**

- **Toast Message:** "Capacity set successfully!" (green success toast)
- **Modal Action:** Automatically closes
- **Calendar Refresh:** Reloads capacity data for all dates in current month
- **Calendar Update:**
  - New/updated date shows capacity indicator
  - Color reflects utilization (calculated as: `current_bookings / max_capacity`)
  - If just set with 0 bookings: Shows "0/10" in green (low utilization)

### 8. **View Updated Calendar**

- **Calendar Reflects Changes:**
  - Date now shows capacity bar (e.g., "5/10")
  - Color indicates utilization status
  - User can set capacity for more dates by clicking other dates
  - User can update existing capacity by clicking same date again

---

## Data Flow Diagram

```
NGO Dashboard
    ↓
[Click "Manage Capacity" or visit /ngo/capacity]
    ↓
ManageCapacity.tsx loads
    ↓
    ├─→ Check: Has locations?
    │   ├─ No → Show empty state
    │   └─ Yes → Show location selector
    ↓
[NGO selects location from dropdown]
    ↓
GET /ngos/locations/{location_id}/capacity
    ↓
Backend returns all capacity records for location
    ↓
Frontend generates calendar grid with existing capacity
    ↓
[Calendar displays with color-coded indicators]
    ↓
[NGO clicks future date on calendar]
    ↓
Validate: Is date future? Is date in current month?
    ├─ No → Show error "Cannot set capacity for past dates"
    └─ Yes → Continue
    ↓
Modal opens with form
    ├─ If new capacity → Title: "Set Capacity"
    └─ If existing → Title: "Update Capacity"
    ↓
[NGO fills max_capacity (required) and notes (optional)]
    ↓
[NGO clicks "Set Capacity" or "Update Capacity"]
    ↓
Frontend validates: max_capacity > 0?
    ├─ No → Show "Capacity must be greater than 0"
    └─ Yes → Continue
    ↓
POST/PUT /ngos/locations/{location_id}/capacity
    ↓
Backend creates/updates NGOLocationCapacity record
    ↓
Success response returned
    ↓
Show toast: "Capacity set successfully!"
    ↓
Modal closes
    ↓
Calendar refreshes and shows updated indicators
```

---

## API Endpoints Used

### 1. **Get All Locations**

```
GET /ngos/locations
Returns: NGOLocation[]
Purpose: Load location dropdown
```

### 2. **Get Capacity for Location (Date Range)**

```
GET /ngos/locations/{location_id}/capacity
Returns: NGOLocationCapacity[]
Purpose: Load all capacity records for calendar

Frontend filters by date range on client side:
- Start: First day of current month
- End: Last day of current month
```

### 3. **Create New Capacity**

```
POST /ngos/locations/{location_id}/capacity
Body: {
  "date": "2025-01-20",
  "max_capacity": 10,
  "notes": "Optional"
}
Returns: NGOLocationCapacity
HTTP Status: 201 Created
```

### 4. **Update Existing Capacity**

```
PUT /ngos/locations/{location_id}/capacity/{capacity_id}
Body: {
  "max_capacity": 15,
  "notes": "Updated notes"
}
Returns: NGOLocationCapacity
HTTP Status: 200 OK
```

---

## State Management (React State)

```typescript
// ManageCapacity.tsx state variables

// Core data
const [locations, setLocations] = useState<NGOLocation[]>([]);
const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
const [capacityData, setCapacityData] = useState<Map<string, NGOLocationCapacity>>(new Map());

// Calendar
const [currentDate, setCurrentDate] = useState<Date>(new Date());
const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

// Form
const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
const [showModal, setShowModal] = useState(false);
const [formData, setFormData] = useState<SetCapacityFormData>({
  date: '',
  max_capacity: 0,
  notes: '',
});

// UI
const [loading, setLoading] = useState(false);
const [showToast, setShowToast] = useState(false);
const [toastMessage, setToastMessage] = useState('');
const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
```

---

## Key Functions

### `loadLocations()`

- Fetches all locations for current NGO
- Sets `locations` state for dropdown
- Auto-selects first location

### `loadCapacityData()`

- Fetches capacity records for selected location
- Filters by current month (start → end date)
- Builds Map: `date → NGOLocationCapacity`
- Triggers calendar regeneration

### `generateCalendar()`

- Creates 42-day grid (6 weeks × 7 days)
- Includes previous/next month days
- Marks today
- Attaches capacity data to each day
- Sets colors based on utilization

### `handleDayClick(day)`

- Validates: Is current month? Is future date?
- Pre-fills form with existing capacity (if any)
- Opens modal

### `handleSaveCapacity()`

- Validates: max_capacity > 0?
- Calls `ngoService.setCapacity()` or `updateCapacity()`
- Shows success/error toast
- Reloads calendar

---

## Calendar Color Coding

| Status  | Color  | Condition                               | Utilization |
| ------- | ------ | --------------------------------------- | ----------- |
| Not Set | Gray   | No capacity                             | N/A         |
| Low     | Green  | `current_bookings / max_capacity < 0.5` | < 50%       |
| Medium  | Yellow | `0.5 ≤ ratio < 0.8`                     | 50-80%      |
| High    | Orange | `0.8 ≤ ratio < 1.0`                     | 80-100%     |
| Full    | Red    | `ratio >= 1.0`                          | 100%+       |

---

## Error Handling

### Frontend Errors

- **"Capacity must be greater than 0"** → User enters 0 or negative value
- **"Cannot set capacity for past dates"** → User clicks past/today date
- **"Failed to load capacity data"** → Network error fetching capacity
- **"Failed to save capacity"** → Backend error (with detail from response)

### Backend Errors

- **403 Forbidden** → User is not an NGO
- **404 Not Found** → Location doesn't belong to NGO
- **400 Bad Request** → Capacity already exists for this date (on POST)

---

## Validation Rules

| Field        | Rule                        | Error Message                              |
| ------------ | --------------------------- | ------------------------------------------ |
| Date         | Must be future              | "Cannot set capacity for past dates"       |
| Max Capacity | Must be > 0                 | "Capacity must be greater than 0"          |
| Location     | Must belong to NGO          | (Backend 403)                              |
| Location     | Must exist                  | (Backend 404)                              |
| Date (POST)  | Must be unique per location | (Backend 400) "Capacity already exists..." |

---

## User Interface Details

### Calendar Day Styling

```
┌──────────┐
│    20    │  ← Day number (today: blue highlight)
│  5/10 🟩 │  ← Capacity bar (color based on status)
└──────────┘

Other month days: Grayed out, not clickable
Past dates (including today): Grayed out, not clickable
Future dates in current month: Clickable, interactive
```

### Modal Form Layout

- Header: "Set Capacity" or "Update Capacity"
- Date display: Full formatted date with calendar icon
- Current bookings: Only shown if updating (read-only)
- Form groups with labels and helper text
- Save button with loading spinner during submission
- Close button to dismiss modal

---

## Complete User Journey Example

```
1. NGO logs in → Dashboard
2. Clicks "Manage Capacity" card
3. Page loads, location dropdown shows 3 locations
4. First location "Mumbai Central" auto-selected
5. Calendar loads showing January 2025
6. January 20 shows "5/10" in yellow (medium usage)
7. NGO clicks January 21 (currently empty, gray)
8. Modal opens: "Set Capacity"
9. NGO enters:
   - Max Capacity: 15
   - Notes: "Increased for Sunday"
10. Clicks "Set Capacity"
11. Backend creates record
12. Toast shows: "Capacity set successfully!"
13. Modal closes
14. Calendar refreshes
15. January 21 now shows "0/15" in green (low usage)
16. NGO can now:
    - Set more dates
    - Update January 21 by clicking again
    - Switch location and set capacity there
    - Navigate to previous/next month
```

---

## Database Schema (Backend)

```sql
-- NGOLocationCapacity Table
CREATE TABLE ngo_location_capacity (
  id INTEGER PRIMARY KEY,
  location_id INTEGER NOT NULL (FK → ngo_location.id),
  date DATE NOT NULL,
  meal_type ENUM (breakfast, lunch, dinner, snacks) NOT NULL,
  max_capacity INTEGER NOT NULL (> 0),
  current_bookings INTEGER DEFAULT 0,
  available_capacity INTEGER DEFAULT max_capacity,
  notes TEXT OPTIONAL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(location_id, date, meal_type)
);
```

**Note:** Current UI doesn't separate by meal_type, but backend schema supports it for future functionality.

---

## Performance Considerations

1. **Calendar Generation:** Done on client (fast, only 42 days)
2. **Capacity Loading:** Fetches entire month, filters client-side
3. **No Pagination:** Monthly view loads all dates at once
4. **Optimized Queries:** Backend uses `selectinload()` for relationship data

---

## Limitations & Future Enhancements

### Current Limitations

- Capacity per day (not per meal type currently used)
- Can only update entire day capacity
- Cannot set recurring capacity (must click each date)
- No bulk upload
- No import/export

### Potential Enhancements

- Bulk capacity setting (e.g., "Set 10 capacity for all weekdays in January")
- Meal-type specific capacity (breakfast vs lunch vs dinner)
- Recurring patterns (e.g., "Every Monday = 20")
- CSV import
- Capacity templates
- Notifications when reaching threshold

---

## Testing the Feature

### Manual Test Flow

1. Create NGO account
2. Verify NGO in admin
3. Add location to NGO
4. Navigate to Manage Capacity
5. Select location
6. Click future date
7. Set max_capacity = 10
8. Submit and verify calendar updates
9. Click same date and update to 15
10. Verify update persists

### API Test Commands

```bash
# Get capacity for location
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/ngos/locations/5/capacity

# Set capacity
curl -X POST -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-01-20","max_capacity":10,"notes":"Test"}' \
  http://localhost:8000/ngos/locations/5/capacity

# Update capacity
curl -X PUT -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"max_capacity":15}' \
  http://localhost:8000/ngos/locations/5/capacity/42
```

---

## Summary

The **Set Capacity** feature provides NGOs with a calendar-based interface to define donation acceptance capacity for each future date at their locations. The flow is straightforward:

1. **Select Location** → 2. **View Calendar** → 3. **Click Future Date** → 4. **Fill Form** → 5. **Submit** → 6. **Calendar Updates**

The system prevents setting capacity for past dates, validates input, and shows real-time capacity utilization through color-coded indicators. All changes persist in the database and are visible immediately in the calendar view.
