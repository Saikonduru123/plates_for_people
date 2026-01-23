-- =====================================================
-- Migration: Add Meal-Type Based Capacity System
-- Date: 2026-01-22
-- Description: Add default capacities to locations and 
--              meal_type to capacity overrides
-- =====================================================

BEGIN;

-- Step 1: Update MealType enum to include snacks (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'snacks' AND enumtypid = 'mealtype'::regtype) THEN
        ALTER TYPE mealtype ADD VALUE 'snacks';
    END IF;
END
$$;

-- Step 2: Update ngo_locations table - Add default capacity columns
ALTER TABLE ngo_locations
ADD COLUMN IF NOT EXISTS default_breakfast_capacity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS default_lunch_capacity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS default_snacks_capacity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS default_dinner_capacity INTEGER DEFAULT 0;

-- Set default values for existing locations
UPDATE ngo_locations
SET 
    default_breakfast_capacity = COALESCE(default_breakfast_capacity, 100),
    default_lunch_capacity = COALESCE(default_lunch_capacity, 200),
    default_snacks_capacity = COALESCE(default_snacks_capacity, 50),
    default_dinner_capacity = COALESCE(default_dinner_capacity, 150)
WHERE default_breakfast_capacity IS NULL 
   OR default_lunch_capacity IS NULL 
   OR default_snacks_capacity IS NULL 
   OR default_dinner_capacity IS NULL;

-- Make columns NOT NULL
ALTER TABLE ngo_locations
ALTER COLUMN default_breakfast_capacity SET NOT NULL,
ALTER COLUMN default_lunch_capacity SET NOT NULL,
ALTER COLUMN default_snacks_capacity SET NOT NULL,
ALTER COLUMN default_dinner_capacity SET NOT NULL;

-- Add check constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_breakfast_capacity') THEN
        ALTER TABLE ngo_locations ADD CONSTRAINT positive_breakfast_capacity CHECK (default_breakfast_capacity >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_lunch_capacity') THEN
        ALTER TABLE ngo_locations ADD CONSTRAINT positive_lunch_capacity CHECK (default_lunch_capacity >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_snacks_capacity') THEN
        ALTER TABLE ngo_locations ADD CONSTRAINT positive_snacks_capacity CHECK (default_snacks_capacity >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_dinner_capacity') THEN
        ALTER TABLE ngo_locations ADD CONSTRAINT positive_dinner_capacity CHECK (default_dinner_capacity >= 0);
    END IF;
END
$$;

-- Step 3: Update ngo_location_capacity table
-- Rename existing columns to match new schema
ALTER TABLE ngo_location_capacity
RENAME COLUMN total_capacity TO capacity;

ALTER TABLE ngo_location_capacity
DROP COLUMN IF EXISTS available_capacity;

-- Add notes column if not exists
ALTER TABLE ngo_location_capacity
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add created_at and updated_at if not exists
ALTER TABLE ngo_location_capacity
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Update check constraint name
ALTER TABLE ngo_location_capacity
DROP CONSTRAINT IF EXISTS check_available_capacity_positive,
DROP CONSTRAINT IF EXISTS check_available_capacity_lte_total;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_capacity' AND conrelid = 'ngo_location_capacity'::regclass) THEN
        ALTER TABLE ngo_location_capacity ADD CONSTRAINT positive_capacity CHECK (capacity >= 0);
    END IF;
END
$$;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_capacity_lookup 
ON ngo_location_capacity(location_id, date, meal_type);

CREATE INDEX IF NOT EXISTS idx_location_capacity_date 
ON ngo_location_capacity(location_id, date);

CREATE INDEX IF NOT EXISTS idx_locations_ngo 
ON ngo_locations(ngo_id) 
WHERE is_active = TRUE;

-- Step 5: Update donation_requests table to ensure meal_type exists
-- (It already exists based on models.py, but this ensures it)
-- No action needed if column exists

COMMIT;

-- Verification Queries (run these after migration)
-- SELECT COUNT(*) FROM ngo_locations WHERE default_breakfast_capacity IS NULL;
-- SELECT COUNT(*) FROM ngo_location_capacity WHERE meal_type IS NULL;
-- SELECT location_id, date, meal_type, COUNT(*) FROM ngo_location_capacity GROUP BY location_id, date, meal_type HAVING COUNT(*) > 1;
