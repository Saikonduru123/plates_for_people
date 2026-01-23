# Meal-Type Capacity System - Implementation Plan

**Date:** January 22, 2026  
**Feature:** Two-Tier Meal-Type Based Capacity System  
**Status:** Planning Phase

## Overview

Implement a granular capacity management system where:

- Each location has default capacities for 4 meal types (Breakfast, Lunch, Snacks, Dinner)
- NGOs can set date-specific manual overrides per location and meal type
- System automatically uses manual capacity if exists, otherwise falls back to location defaults
- All capacity calculations are per-location basis (independent)

---

## Phase 1: Database Schema Changes

### 1.1 Update `ngo_locations` Table

**File:** Backend database migration  
**Task:** Add default capacity columns for each meal type

**Changes:**

```sql
ALTER TABLE ngo_locations
ADD COLUMN default_breakfast_capacity INTEGER DEFAULT 0,
ADD COLUMN default_lunch_capacity INTEGER DEFAULT 0,
ADD COLUMN default_snacks_capacity INTEGER DEFAULT 0,
ADD COLUMN default_dinner_capacity INTEGER DEFAULT 0;
```

**Migration Strategy:**

- Add columns with default value 0
- Update existing locations with reasonable defaults (e.g., 100 for each)
- Add NOT NULL constraint after data migration

### 1.2 Update `ngo_location_capacity` Table

**File:** Backend database migration  
**Task:** Add meal_type column and update structure

**Changes:**

```sql
-- Add meal_type column
ALTER TABLE ngo_location_capacity
ADD COLUMN meal_type VARCHAR(20);

-- Create ENUM type (if using PostgreSQL)
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'snacks', 'dinner');

ALTER TABLE ngo_location_capacity
ALTER COLUMN meal_type TYPE meal_type_enum USING meal_type::meal_type_enum;

-- Update unique constraint to include meal_type
ALTER TABLE ngo_location_capacity
DROP CONSTRAINT IF EXISTS unique_location_date;

ALTER TABLE ngo_location_capacity
ADD CONSTRAINT unique_location_date_meal
UNIQUE (location_id, date, meal_type);
```

**Migration Strategy:**

- Add meal_type column as nullable first
- Migrate existing records (set all to 'lunch' or delete if cleanup needed)
- Make meal_type NOT NULL
- Update constraints

### 1.3 Create Migration Script

**File:** `backend/migrations/add_meal_type_capacity.py`

**Priority:** HIGH  
**Dependencies:** None  
**Estimated Time:** 2 hours

---

## Phase 2: Backend Models Update

### 2.1 Update SQLAlchemy Models

**File:** `backend/app/models.py`

**Changes Needed:**

```python
# Add to NGOLocation model
class NGOLocation(Base):
    # ... existing fields ...
    default_breakfast_capacity = Column(Integer, default=0, nullable=False)
    default_lunch_capacity = Column(Integer, default=0, nullable=False)
    default_snacks_capacity = Column(Integer, default=0, nullable=False)
    default_dinner_capacity = Column(Integer, default=0, nullable=False)

# Update NGOLocationCapacity model
class NGOLocationCapacity(Base):
    # ... existing fields ...
    meal_type = Column(Enum('breakfast', 'lunch', 'snacks', 'dinner', name='meal_type_enum'), nullable=False)

    __table_args__ = (
        UniqueConstraint('location_id', 'date', 'meal_type', name='unique_location_date_meal'),
    )
```

**Priority:** HIGH  
**Dependencies:** Phase 1 complete  
**Estimated Time:** 1 hour

### 2.2 Update Pydantic Schemas

**File:** `backend/app/models.py` or separate schemas file

**Changes Needed:**

```python
from enum import Enum

class MealType(str, Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    snacks = "snacks"
    dinner = "dinner"

class LocationCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    default_breakfast_capacity: int = 0
    default_lunch_capacity: int = 0
    default_snacks_capacity: int = 0
    default_dinner_capacity: int = 0

class LocationResponse(BaseModel):
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    default_breakfast_capacity: int
    default_lunch_capacity: int
    default_snacks_capacity: int
    default_dinner_capacity: int

class SetCapacityRequest(BaseModel):
    location_id: int
    date: date
    meal_type: MealType
    capacity: int
    notes: Optional[str] = None

class CapacityResponse(BaseModel):
    location_id: int
    date: date
    meal_type: MealType
    capacity: int
    is_manual: bool  # True if from ngo_location_capacity, False if from defaults
    notes: Optional[str] = None
```

**Priority:** HIGH  
**Dependencies:** Phase 2.1 complete  
**Estimated Time:** 1 hour

---

## Phase 3: Backend API Updates

### 3.1 Update Location Endpoints

**File:** `backend/app/main.py` or `backend/app/routes/locations.py`

**Endpoints to Update:**

**POST /ngo/locations** - Create Location

```python
@router.post("/ngo/locations")
async def create_location(
    location: LocationCreate,
    current_user: User = Depends(get_current_ngo_user)
):
    # Add default_*_capacity fields to insert
    pass
```

**PUT /ngo/locations/{location_id}** - Update Location

```python
@router.put("/ngo/locations/{location_id}")
async def update_location(
    location_id: int,
    location: LocationCreate,
    current_user: User = Depends(get_current_ngo_user)
):
    # Update default_*_capacity fields
    pass
```

**Priority:** HIGH  
**Dependencies:** Phase 2 complete  
**Estimated Time:** 2 hours

### 3.2 Update Capacity Endpoints

**File:** `backend/app/main.py`

**POST /ngo/capacity** - Set Manual Capacity

```python
@router.post("/ngo/capacity")
async def set_location_capacity(
    capacity_data: SetCapacityRequest,
    current_user: User = Depends(get_current_ngo_user)
):
    # Validate location belongs to NGO
    # Insert/Update capacity with meal_type
    # Return success
    pass
```

**GET /ngo/capacity/{location_id}** - Get Capacity for Location

```python
@router.get("/ngo/capacity/{location_id}")
async def get_location_capacity(
    location_id: int,
    date: date,
    meal_type: Optional[MealType] = None,
    current_user: User = Depends(get_current_ngo_user)
):
    # If meal_type provided: return capacity for that meal
    # If meal_type not provided: return all 4 meal types
    # Use get_capacity_for_date() helper
    pass
```

**Priority:** HIGH  
**Dependencies:** Phase 2 complete  
**Estimated Time:** 3 hours

### 3.3 Create Capacity Calculator Service

**File:** `backend/app/services/capacity_service.py` (new file)

**Core Function:**

```python
async def get_capacity_for_date(
    db: AsyncSession,
    location_id: int,
    date: date,
    meal_type: MealType
) -> dict:
    """
    Get capacity for a specific location, date, and meal type.
    Returns manual capacity if exists, otherwise location default.

    Returns:
        {
            'capacity': int,
            'is_manual': bool,
            'available': int,  # capacity - confirmed_donations
            'notes': str | None
        }
    """
    # 1. Check for manual capacity
    manual = await db.execute(
        select(NGOLocationCapacity)
        .where(
            NGOLocationCapacity.location_id == location_id,
            NGOLocationCapacity.date == date,
            NGOLocationCapacity.meal_type == meal_type
        )
    )
    manual_capacity = manual.scalar_one_or_none()

    if manual_capacity:
        capacity = manual_capacity.capacity
        is_manual = True
        notes = manual_capacity.notes
    else:
        # 2. Fallback to location defaults
        location = await db.get(NGOLocation, location_id)
        capacity = getattr(location, f'default_{meal_type}_capacity')
        is_manual = False
        notes = None

    # 3. Calculate confirmed donations
    confirmed = await db.execute(
        select(func.coalesce(func.sum(Donation.quantity), 0))
        .where(
            Donation.location_id == location_id,
            Donation.pickup_date == date,
            Donation.meal_type == meal_type,
            Donation.status.in_(['confirmed', 'completed'])
        )
    )
    confirmed_count = confirmed.scalar()

    return {
        'capacity': capacity,
        'is_manual': is_manual,
        'available': max(0, capacity - confirmed_count),
        'notes': notes
    }
```

**Priority:** CRITICAL  
**Dependencies:** Phase 2 complete  
**Estimated Time:** 3 hours

### 3.4 Update Search/Smart Donate Endpoints

**File:** `backend/app/main.py`

**GET /donor/search** - Search NGOs with capacity filter

```python
@router.get("/donor/search")
async def search_ngos(
    meal_type: Optional[MealType] = None,
    date: Optional[date] = None,
    # ... other filters
):
    # When filtering by capacity, use get_capacity_for_date()
    # For each location, check meal-specific capacity
    pass
```

**POST /donor/smart-donate** - Smart matching with meal type

```python
@router.post("/donor/smart-donate")
async def smart_donate(
    meal_type: MealType,
    quantity: int,
    date: date,
    # ... other params
):
    # Match based on meal-specific capacity
    # Use get_capacity_for_date() for each candidate
    pass
```

**Priority:** HIGH  
**Dependencies:** Phase 3.3 complete  
**Estimated Time:** 4 hours

---

## Phase 4: Frontend Updates

### 4.1 Update Location Management

**File:** `frontend/plates-for-people/src/pages/ngo/AddEditLocation.tsx`

**Changes:**

- Add 4 input fields for default capacities:
  - Default Breakfast Capacity
  - Default Lunch Capacity
  - Default Snacks Capacity
  - Default Dinner Capacity
- Update form validation
- Update API calls to include new fields

**UI Design:**

```
[Location Name Input]
[Address Input]
[Map Component]

── Default Meal Capacities ──────────
[🌅 Breakfast]  [____] meals/day
[☀️  Lunch]      [____] meals/day
[🥤 Snacks]     [____] meals/day
[🌙 Dinner]     [____] meals/day
─────────────────────────────────────

[Save Location] [Cancel]
```

**Priority:** HIGH  
**Dependencies:** Backend Phase 3.1 complete  
**Estimated Time:** 3 hours

### 4.2 Update Manage Capacity Page

**File:** `frontend/plates-for-people/src/pages/ngo/ManageCapacity.tsx`

**Major Changes:**

- Add meal type selector (tabs or dropdown)
- Update calendar to show meal-type specific capacity
- Update capacity entry form to include meal type
- Show visual indicator for manual vs default capacity
- Add bulk actions (set capacity for multiple dates/meals)

**UI Design:**

```
Manage Capacity
─────────────────────────────────────

Location: [Select Location ▼]

Meal Type: [Breakfast] [Lunch] [Snacks] [Dinner]

─── January 2026 ──────────────────
Sun  Mon  Tue  Wed  Thu  Fri  Sat
                   1    2    3    4
                 100* 100* 100* 100*
  5    6    7    8    9   10   11
100* 100* 150  100* 100* 100* 100*
...

* = Using default capacity
Bold = Manual override set

Selected: January 7, 2026
─────────────────────────────────────
Meal Type: [Breakfast ▼]
Capacity:  [150______] meals
Notes:     [Special event___________]

Current: 150 (Manual)
Default: 100
Bookings: 45 confirmed

[Save Capacity] [Reset to Default]
```

**Priority:** CRITICAL  
**Dependencies:** Backend Phase 3.2 complete  
**Estimated Time:** 5 hours

### 4.3 Update Donor Donation Flow

**File:** `frontend/plates-for-people/src/pages/donor/CreateDonation.tsx`

**Changes:**

- Add meal type selector prominently
- Update capacity display based on meal type
- Real-time availability check per meal type

**File:** `frontend/plates-for-people/src/pages/donor/SmartDonate.tsx`

**Changes:**

- Add meal type selection at top
- Filter/sort based on meal-type specific capacity
- Show meal-type availability in results

**Priority:** HIGH  
**Dependencies:** Backend Phase 3.4 complete  
**Estimated Time:** 4 hours

### 4.4 Create Capacity Service

**File:** `frontend/plates-for-people/src/services/capacityService.ts` (new file)

**Functions:**

```typescript
export interface MealTypeCapacity {
  mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  capacity: number;
  isManual: boolean;
  available: number;
  notes?: string;
}

export const capacityService = {
  // Get capacity for specific meal
  getCapacity: async (locationId: number, date: string, mealType: string): Promise<MealTypeCapacity> => {},

  // Get all meal capacities for a date
  getDayCapacity: async (locationId: number, date: string): Promise<MealTypeCapacity[]> => {},

  // Set manual capacity
  setCapacity: async (locationId: number, date: string, mealType: string, capacity: number, notes?: string): Promise<void> => {},

  // Reset to default (delete manual override)
  resetToDefault: async (locationId: number, date: string, mealType: string): Promise<void> => {},
};
```

**Priority:** HIGH  
**Dependencies:** Backend Phase 3 complete  
**Estimated Time:** 2 hours

---

## Phase 5: Testing & Validation

### 5.1 Backend Testing

**Tasks:**

- Test capacity calculator with various scenarios
- Test manual override creation/update/delete
- Test default capacity fallback
- Test per-location independence
- Test capacity availability calculation
- Load testing with multiple concurrent donations

**Test Scenarios:**

1. Location with all defaults, no manual overrides
2. Location with mixed manual/default capacities
3. Multiple locations with different settings
4. Edge cases: capacity = 0, negative values, null handling
5. Concurrent donation booking race conditions

**Priority:** HIGH  
**Estimated Time:** 4 hours

### 5.2 Frontend Testing

**Tasks:**

- Test location creation with default capacities
- Test capacity management UI for all meal types
- Test calendar view with manual/default indicators
- Test donor search with meal-type filters
- Test smart donate with meal-type matching
- Mobile responsiveness testing

**Priority:** HIGH  
**Estimated Time:** 3 hours

### 5.3 Integration Testing

**Tasks:**

- End-to-end flow: Create location → Set defaults → Override specific dates → Donor searches → Books donation
- Data migration validation
- Cross-browser testing
- Performance testing with large datasets

**Priority:** MEDIUM  
**Estimated Time:** 3 hours

---

## Phase 6: Data Migration & Deployment

### 6.1 Prepare Migration Script

**File:** `backend/scripts/migrate_capacity_data.py`

**Tasks:**

- Backup existing data
- Migrate ngo_locations with default values
- Migrate ngo_location_capacity with meal_type
- Validate data integrity
- Rollback plan

**Priority:** CRITICAL  
**Estimated Time:** 3 hours

### 6.2 Staged Deployment

1. **Dev Environment:** Deploy all changes, test thoroughly
2. **Run Migration:** Execute database migration on dev
3. **User Acceptance Testing:** NGO users test new capacity system
4. **Production Deployment:** Deploy to production with migration
5. **Monitor:** Watch for errors, performance issues

**Priority:** CRITICAL  
**Estimated Time:** 2 hours

---

## Implementation Order

### Week 1: Backend Foundation

**Days 1-2:**

- Phase 1: Database schema changes
- Phase 2: Models and schemas update

**Days 3-4:**

- Phase 3.1-3.2: Location and capacity endpoints
- Phase 3.3: Capacity calculator service

**Day 5:**

- Phase 3.4: Search and smart donate updates
- Backend testing

### Week 2: Frontend & Integration

**Days 1-2:**

- Phase 4.1: Location management updates
- Phase 4.2: Manage capacity page overhaul

**Days 3-4:**

- Phase 4.3: Donor flow updates
- Phase 4.4: Capacity service

**Day 5:**

- Phase 5: Testing and validation

### Week 3: Deployment

**Days 1-2:**

- Phase 6.1: Migration preparation
- Final testing

**Day 3:**

- Phase 6.2: Staged deployment
- Production release

---

## Risk Mitigation

### Data Loss Risk

- **Mitigation:** Complete database backup before migration
- **Rollback:** Keep migration script reversible

### Performance Impact

- **Mitigation:** Index on (location_id, date, meal_type)
- **Monitor:** Query performance, add caching if needed

### User Confusion

- **Mitigation:** Clear UI labels, tooltips, help documentation
- **Training:** Provide user guide and video tutorial

### Breaking Changes

- **Mitigation:** Maintain backward compatibility during transition
- **API Versioning:** Consider /api/v2 if major breaking changes

---

## Success Metrics

- ✅ All 4 meal types independently manageable
- ✅ Manual overrides working correctly
- ✅ Default capacity fallback functioning
- ✅ Per-location independence verified
- ✅ Donor can filter/search by meal type
- ✅ Smart matching considers meal-specific capacity
- ✅ Zero data loss during migration
- ✅ Performance within acceptable limits (<500ms response time)

---

## Team Assignments

**Backend Developer:**

- Phases 1, 2, 3
- Database migration
- API endpoints

**Frontend Developer:**

- Phase 4
- UI components
- Service integration

**QA Engineer:**

- Phase 5
- Test case creation
- Regression testing

**DevOps:**

- Phase 6
- Deployment automation
- Monitoring setup

---

## Notes

- Meal types are hardcoded: breakfast, lunch, snacks, dinner (not user-configurable)
- All capacity values are integers (number of meals)
- Dates are stored in ISO format (YYYY-MM-DD)
- Manual overrides can be deleted (reset to default) by NGO
- System should handle timezone considerations for date calculations
- Consider adding capacity history/audit log for future analytics
