# Database Schema: Meal-Type Capacity System

**Feature:** Two-Tier Meal-Type Based Capacity  
**Database:** PostgreSQL  
**Date:** January 22, 2026

---

## Overview

This document details the database schema changes required to implement the meal-type based capacity system with default and manual override capabilities.

---

## Schema Changes

### 1. `ngo_locations` Table Updates

**Purpose:** Store default capacity values for each meal type at the location level.

#### New Columns

| Column Name                  | Type    | Nullable | Default | Description                      |
| ---------------------------- | ------- | -------- | ------- | -------------------------------- |
| `default_breakfast_capacity` | INTEGER | NO       | 0       | Default daily breakfast capacity |
| `default_lunch_capacity`     | INTEGER | NO       | 0       | Default daily lunch capacity     |
| `default_snacks_capacity`    | INTEGER | NO       | 0       | Default daily snacks capacity    |
| `default_dinner_capacity`    | INTEGER | NO       | 0       | Default daily dinner capacity    |

#### Complete Table Structure (After Changes)

```sql
CREATE TABLE ngo_locations (
    id SERIAL PRIMARY KEY,
    ngo_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- NEW COLUMNS
    default_breakfast_capacity INTEGER NOT NULL DEFAULT 0,
    default_lunch_capacity INTEGER NOT NULL DEFAULT 0,
    default_snacks_capacity INTEGER NOT NULL DEFAULT 0,
    default_dinner_capacity INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT positive_breakfast_capacity CHECK (default_breakfast_capacity >= 0),
    CONSTRAINT positive_lunch_capacity CHECK (default_lunch_capacity >= 0),
    CONSTRAINT positive_snacks_capacity CHECK (default_snacks_capacity >= 0),
    CONSTRAINT positive_dinner_capacity CHECK (default_dinner_capacity >= 0)
);
```

#### Migration Script

```sql
-- Step 1: Add columns with nullable first
ALTER TABLE ngo_locations
ADD COLUMN default_breakfast_capacity INTEGER,
ADD COLUMN default_lunch_capacity INTEGER,
ADD COLUMN default_snacks_capacity INTEGER,
ADD COLUMN default_dinner_capacity INTEGER;

-- Step 2: Set default values for existing records
UPDATE ngo_locations
SET
    default_breakfast_capacity = 100,
    default_lunch_capacity = 200,
    default_snacks_capacity = 50,
    default_dinner_capacity = 150
WHERE default_breakfast_capacity IS NULL;

-- Step 3: Make columns NOT NULL
ALTER TABLE ngo_locations
ALTER COLUMN default_breakfast_capacity SET NOT NULL,
ALTER COLUMN default_lunch_capacity SET NOT NULL,
ALTER COLUMN default_snacks_capacity SET NOT NULL,
ALTER COLUMN default_dinner_capacity SET NOT NULL;

-- Step 4: Set defaults for future inserts
ALTER TABLE ngo_locations
ALTER COLUMN default_breakfast_capacity SET DEFAULT 0,
ALTER COLUMN default_lunch_capacity SET DEFAULT 0,
ALTER COLUMN default_snacks_capacity SET DEFAULT 0,
ALTER COLUMN default_dinner_capacity SET DEFAULT 0;

-- Step 5: Add check constraints
ALTER TABLE ngo_locations
ADD CONSTRAINT positive_breakfast_capacity CHECK (default_breakfast_capacity >= 0),
ADD CONSTRAINT positive_lunch_capacity CHECK (default_lunch_capacity >= 0),
ADD CONSTRAINT positive_snacks_capacity CHECK (default_snacks_capacity >= 0),
ADD CONSTRAINT positive_dinner_capacity CHECK (default_dinner_capacity >= 0);
```

#### Rollback Script

```sql
ALTER TABLE ngo_locations
DROP CONSTRAINT IF EXISTS positive_breakfast_capacity,
DROP CONSTRAINT IF EXISTS positive_lunch_capacity,
DROP CONSTRAINT IF EXISTS positive_snacks_capacity,
DROP CONSTRAINT IF EXISTS positive_dinner_capacity;

ALTER TABLE ngo_locations
DROP COLUMN default_breakfast_capacity,
DROP COLUMN default_lunch_capacity,
DROP COLUMN default_snacks_capacity,
DROP COLUMN default_dinner_capacity;
```

---

### 2. `ngo_location_capacity` Table Updates

**Purpose:** Store manual capacity overrides for specific dates and meal types.

#### New Columns & Changes

| Column Name | Type           | Nullable | Default | Description                                  |
| ----------- | -------------- | -------- | ------- | -------------------------------------------- |
| `meal_type` | meal_type_enum | NO       | -       | Type of meal (breakfast/lunch/snacks/dinner) |

#### Create ENUM Type

```sql
CREATE TYPE meal_type_enum AS ENUM (
    'breakfast',
    'lunch',
    'snacks',
    'dinner'
);
```

#### Complete Table Structure (After Changes)

```sql
CREATE TABLE ngo_location_capacity (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES ngo_locations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type meal_type_enum NOT NULL,  -- NEW COLUMN
    capacity INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Updated constraint to include meal_type
    CONSTRAINT unique_location_date_meal UNIQUE (location_id, date, meal_type),
    CONSTRAINT positive_capacity CHECK (capacity >= 0)
);

-- Index for fast lookups
CREATE INDEX idx_location_capacity_lookup
ON ngo_location_capacity(location_id, date, meal_type);

-- Index for date-based queries
CREATE INDEX idx_location_capacity_date
ON ngo_location_capacity(location_id, date);
```

#### Migration Script

```sql
-- Step 1: Create ENUM type
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'snacks', 'dinner');

-- Step 2: Add meal_type column (nullable first)
ALTER TABLE ngo_location_capacity
ADD COLUMN meal_type meal_type_enum;

-- Step 3: Migrate existing data
-- Option A: Set all existing records to 'lunch' (most common meal)
UPDATE ngo_location_capacity
SET meal_type = 'lunch'
WHERE meal_type IS NULL;

-- Option B: Delete existing records (if data is not critical)
-- DELETE FROM ngo_location_capacity;

-- Step 4: Make meal_type NOT NULL
ALTER TABLE ngo_location_capacity
ALTER COLUMN meal_type SET NOT NULL;

-- Step 5: Drop old unique constraint
ALTER TABLE ngo_location_capacity
DROP CONSTRAINT IF EXISTS unique_location_date;

-- Step 6: Add new unique constraint including meal_type
ALTER TABLE ngo_location_capacity
ADD CONSTRAINT unique_location_date_meal
UNIQUE (location_id, date, meal_type);

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_location_capacity_lookup
ON ngo_location_capacity(location_id, date, meal_type);

CREATE INDEX IF NOT EXISTS idx_location_capacity_date
ON ngo_location_capacity(location_id, date);
```

#### Rollback Script

```sql
-- Drop indexes
DROP INDEX IF EXISTS idx_location_capacity_lookup;
DROP INDEX IF EXISTS idx_location_capacity_date;

-- Drop new constraint
ALTER TABLE ngo_location_capacity
DROP CONSTRAINT IF EXISTS unique_location_date_meal;

-- Restore old constraint
ALTER TABLE ngo_location_capacity
ADD CONSTRAINT unique_location_date UNIQUE (location_id, date);

-- Drop meal_type column
ALTER TABLE ngo_location_capacity
DROP COLUMN meal_type;

-- Drop ENUM type
DROP TYPE IF EXISTS meal_type_enum;
```

---

## Data Examples

### Example 1: Location with Defaults Only

**ngo_locations:**
| id | name | default_breakfast | default_lunch | default_snacks | default_dinner |
|----|------|------------------|---------------|----------------|----------------|
| 1 | Main Kitchen | 100 | 200 | 50 | 150 |

**ngo_location_capacity:**
_(empty - no manual overrides)_

**Result:**

- Every day uses default values: B:100, L:200, S:50, D:150

---

### Example 2: Location with Manual Overrides

**ngo_locations:**
| id | name | default_breakfast | default_lunch | default_snacks | default_dinner |
|----|------|------------------|---------------|----------------|----------------|
| 2 | Community Hall | 150 | 250 | 75 | 200 |

**ngo_location_capacity:**
| id | location_id | date | meal_type | capacity | notes |
|----|-------------|------|-----------|----------|-------|
| 1 | 2 | 2026-01-25 | lunch | 350 | Special community event |
| 2 | 2 | 2026-01-25 | dinner | 300 | Evening program |
| 3 | 2 | 2026-01-27 | breakfast | 100 | Kitchen maintenance |

**Result for 2026-01-25:**

- Breakfast: 150 (default)
- Lunch: 350 (manual override)
- Snacks: 75 (default)
- Dinner: 300 (manual override)

**Result for 2026-01-27:**

- Breakfast: 100 (manual override)
- Lunch: 250 (default)
- Snacks: 75 (default)
- Dinner: 200 (default)

---

## Query Examples

### Get Capacity for Specific Date & Meal

```sql
-- Get lunch capacity for location 1 on 2026-01-25
WITH manual AS (
    SELECT capacity, notes
    FROM ngo_location_capacity
    WHERE location_id = 1
      AND date = '2026-01-25'
      AND meal_type = 'lunch'
    LIMIT 1
),
defaults AS (
    SELECT default_lunch_capacity as capacity
    FROM ngo_locations
    WHERE id = 1
)
SELECT
    COALESCE(manual.capacity, defaults.capacity) as capacity,
    CASE WHEN manual.capacity IS NOT NULL THEN TRUE ELSE FALSE END as is_manual,
    manual.notes
FROM defaults
LEFT JOIN manual ON TRUE;
```

### Get All Capacities for a Date

```sql
-- Get all meal capacities for location 1 on 2026-01-25
SELECT
    meal_type,
    COALESCE(cap.capacity,
        CASE meal_type
            WHEN 'breakfast' THEN loc.default_breakfast_capacity
            WHEN 'lunch' THEN loc.default_lunch_capacity
            WHEN 'snacks' THEN loc.default_snacks_capacity
            WHEN 'dinner' THEN loc.default_dinner_capacity
        END
    ) as capacity,
    cap.capacity IS NOT NULL as is_manual,
    cap.notes
FROM
    (VALUES ('breakfast'), ('lunch'), ('snacks'), ('dinner')) AS meals(meal_type)
CROSS JOIN ngo_locations loc
LEFT JOIN ngo_location_capacity cap
    ON cap.location_id = loc.id
    AND cap.date = '2026-01-25'
    AND cap.meal_type = meals.meal_type::meal_type_enum
WHERE loc.id = 1;
```

### Get Available Capacity (Capacity - Confirmed Bookings)

```sql
-- Get available capacity for location 1, date 2026-01-25, lunch
WITH capacity AS (
    SELECT
        COALESCE(
            (SELECT capacity FROM ngo_location_capacity
             WHERE location_id = 1 AND date = '2026-01-25' AND meal_type = 'lunch'),
            (SELECT default_lunch_capacity FROM ngo_locations WHERE id = 1)
        ) as max_capacity
),
confirmed AS (
    SELECT COALESCE(SUM(quantity), 0) as booked
    FROM donations
    WHERE location_id = 1
      AND pickup_date = '2026-01-25'
      AND meal_type = 'lunch'
      AND status IN ('confirmed', 'completed')
)
SELECT
    max_capacity,
    booked,
    GREATEST(0, max_capacity - booked) as available
FROM capacity, confirmed;
```

### Bulk Get Capacities for Multiple Locations

```sql
-- Get lunch capacity for all active locations on 2026-01-25
SELECT
    loc.id as location_id,
    loc.name,
    COALESCE(cap.capacity, loc.default_lunch_capacity) as capacity,
    cap.capacity IS NOT NULL as is_manual
FROM ngo_locations loc
LEFT JOIN ngo_location_capacity cap
    ON cap.location_id = loc.id
    AND cap.date = '2026-01-25'
    AND cap.meal_type = 'lunch'
WHERE loc.is_active = TRUE
  AND loc.ngo_id = 123;  -- specific NGO
```

---

## Database Performance Considerations

### Indexes

```sql
-- Primary lookup index (location + date + meal_type)
CREATE INDEX idx_location_capacity_lookup
ON ngo_location_capacity(location_id, date, meal_type);

-- Date range queries
CREATE INDEX idx_location_capacity_date_range
ON ngo_location_capacity(location_id, date);

-- NGO-based location queries
CREATE INDEX idx_locations_ngo
ON ngo_locations(ngo_id)
WHERE is_active = TRUE;
```

### Expected Query Performance

| Query Type                            | Expected Response Time |
| ------------------------------------- | ---------------------- |
| Get capacity for 1 location/date/meal | < 10ms                 |
| Get all meals for 1 location/date     | < 20ms                 |
| Get capacities for 1 week             | < 50ms                 |
| Bulk search across locations          | < 200ms                |

### Storage Estimates

**Assumptions:**

- 500 NGOs
- Average 3 locations per NGO
- 10% of dates have manual overrides
- 1 year of data

**Storage:**

- `ngo_locations`: 1,500 rows × ~200 bytes = 300 KB
- `ngo_location_capacity`: 1,500 locations × 365 days × 0.1 × 4 meals = 219,000 rows × ~150 bytes = 33 MB

---

## Data Integrity Rules

### Constraints

1. **Capacity must be non-negative**

   ```sql
   CHECK (capacity >= 0)
   CHECK (default_*_capacity >= 0)
   ```

2. **Unique constraint per location-date-meal**

   ```sql
   UNIQUE (location_id, date, meal_type)
   ```

3. **Referential integrity**

   ```sql
   FOREIGN KEY (location_id) REFERENCES ngo_locations(id) ON DELETE CASCADE
   ```

4. **Meal type must be valid**
   ```sql
   meal_type meal_type_enum NOT NULL
   ```

### Business Rules

1. Manual capacity overrides default capacity
2. If manual capacity deleted, system falls back to default
3. Capacity calculation: available = max - confirmed_bookings
4. Each location manages capacity independently
5. Past dates can have capacity set (for historical record keeping)
6. Capacity can be 0 (location closed for that meal)

---

## Migration Checklist

- [ ] Backup production database
- [ ] Test migration script on dev database
- [ ] Verify data integrity after migration
- [ ] Test all capacity queries
- [ ] Update API endpoints
- [ ] Update frontend code
- [ ] Test end-to-end flows
- [ ] Create rollback plan
- [ ] Document changes
- [ ] Train NGO users

---

## Maintenance Queries

### Clean Up Old Manual Overrides (Optional)

```sql
-- Delete manual overrides older than 1 year
DELETE FROM ngo_location_capacity
WHERE date < CURRENT_DATE - INTERVAL '1 year';
```

### Find Locations with High Manual Override Rate

```sql
-- Find locations that override defaults >50% of the time
WITH override_stats AS (
    SELECT
        location_id,
        COUNT(*) as override_count,
        COUNT(DISTINCT date) as days_with_overrides
    FROM ngo_location_capacity
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY location_id
)
SELECT
    loc.name,
    override_count,
    days_with_overrides,
    ROUND(100.0 * override_count / (30 * 4), 2) as override_percentage
FROM override_stats os
JOIN ngo_locations loc ON loc.id = os.location_id
WHERE override_count > 60  -- More than 50% of possible overrides (30 days * 4 meals * 0.5)
ORDER BY override_percentage DESC;
```

### Audit Capacity Changes

```sql
-- To implement audit trail (future enhancement)
CREATE TABLE ngo_location_capacity_audit (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL,
    date DATE NOT NULL,
    meal_type meal_type_enum NOT NULL,
    old_capacity INTEGER,
    new_capacity INTEGER,
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Related Tables

### `donations` Table Update (Required)

Add `meal_type` column to donations table:

```sql
ALTER TABLE donations
ADD COLUMN meal_type meal_type_enum;

-- Migrate existing donations
UPDATE donations
SET meal_type = 'lunch'  -- default value
WHERE meal_type IS NULL;

ALTER TABLE donations
ALTER COLUMN meal_type SET NOT NULL;

-- Add index
CREATE INDEX idx_donations_capacity_check
ON donations(location_id, pickup_date, meal_type, status);
```

This allows accurate capacity calculation by filtering donations by meal type.

---

## Complete Migration Script

**File:** `backend/migrations/001_add_meal_type_capacity.sql`

```sql
-- =====================================================
-- Migration: Add Meal-Type Based Capacity System
-- Date: 2026-01-22
-- Description: Add default capacities to locations and
--              meal_type to capacity overrides
-- =====================================================

BEGIN;

-- Step 1: Create ENUM type
CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'snacks', 'dinner');

-- Step 2: Update ngo_locations table
ALTER TABLE ngo_locations
ADD COLUMN default_breakfast_capacity INTEGER,
ADD COLUMN default_lunch_capacity INTEGER,
ADD COLUMN default_snacks_capacity INTEGER,
ADD COLUMN default_dinner_capacity INTEGER;

-- Set default values for existing locations
UPDATE ngo_locations
SET
    default_breakfast_capacity = 100,
    default_lunch_capacity = 200,
    default_snacks_capacity = 50,
    default_dinner_capacity = 150;

-- Make columns NOT NULL
ALTER TABLE ngo_locations
ALTER COLUMN default_breakfast_capacity SET NOT NULL,
ALTER COLUMN default_lunch_capacity SET NOT NULL,
ALTER COLUMN default_snacks_capacity SET NOT NULL,
ALTER COLUMN default_dinner_capacity SET NOT NULL,
ALTER COLUMN default_breakfast_capacity SET DEFAULT 0,
ALTER COLUMN default_lunch_capacity SET DEFAULT 0,
ALTER COLUMN default_snacks_capacity SET DEFAULT 0,
ALTER COLUMN default_dinner_capacity SET DEFAULT 0;

-- Add check constraints
ALTER TABLE ngo_locations
ADD CONSTRAINT positive_breakfast_capacity CHECK (default_breakfast_capacity >= 0),
ADD CONSTRAINT positive_lunch_capacity CHECK (default_lunch_capacity >= 0),
ADD CONSTRAINT positive_snacks_capacity CHECK (default_snacks_capacity >= 0),
ADD CONSTRAINT positive_dinner_capacity CHECK (default_dinner_capacity >= 0);

-- Step 3: Update ngo_location_capacity table
ALTER TABLE ngo_location_capacity
ADD COLUMN meal_type meal_type_enum;

-- Migrate existing capacity records (set to lunch by default)
UPDATE ngo_location_capacity
SET meal_type = 'lunch'
WHERE meal_type IS NULL;

-- Make meal_type NOT NULL
ALTER TABLE ngo_location_capacity
ALTER COLUMN meal_type SET NOT NULL;

-- Drop old constraint and add new one
ALTER TABLE ngo_location_capacity
DROP CONSTRAINT IF EXISTS unique_location_date,
ADD CONSTRAINT unique_location_date_meal UNIQUE (location_id, date, meal_type);

-- Add indexes
CREATE INDEX idx_location_capacity_lookup
ON ngo_location_capacity(location_id, date, meal_type);

CREATE INDEX idx_location_capacity_date
ON ngo_location_capacity(location_id, date);

-- Step 4: Update donations table (if exists)
ALTER TABLE donations
ADD COLUMN meal_type meal_type_enum;

UPDATE donations
SET meal_type = 'lunch'
WHERE meal_type IS NULL;

ALTER TABLE donations
ALTER COLUMN meal_type SET NOT NULL;

CREATE INDEX idx_donations_capacity_check
ON donations(location_id, pickup_date, meal_type, status);

COMMIT;
```

---

## Verification Queries

After migration, run these queries to verify:

```sql
-- 1. Check all locations have default capacities
SELECT COUNT(*)
FROM ngo_locations
WHERE default_breakfast_capacity IS NULL
   OR default_lunch_capacity IS NULL
   OR default_snacks_capacity IS NULL
   OR default_dinner_capacity IS NULL;
-- Expected: 0

-- 2. Check all capacity overrides have meal_type
SELECT COUNT(*)
FROM ngo_location_capacity
WHERE meal_type IS NULL;
-- Expected: 0

-- 3. Check all donations have meal_type
SELECT COUNT(*)
FROM donations
WHERE meal_type IS NULL;
-- Expected: 0

-- 4. Verify unique constraint
SELECT location_id, date, meal_type, COUNT(*)
FROM ngo_location_capacity
GROUP BY location_id, date, meal_type
HAVING COUNT(*) > 1;
-- Expected: 0 rows
```

---

**End of Database Schema Documentation**
