-- Migration: Drop current_capacity column from ngo_location_capacity
-- The new schema only uses 'capacity' column

BEGIN;

-- Drop current_capacity if it exists
ALTER TABLE ngo_location_capacity
DROP COLUMN IF EXISTS current_capacity;

-- Ensure updated_at has default
ALTER TABLE ngo_location_capacity 
ALTER COLUMN updated_at SET DEFAULT NOW();

COMMIT;
