-- Migration: Fix updated_at default value in ngo_location_capacity
-- Add server default for updated_at column

ALTER TABLE ngo_location_capacity 
  ALTER COLUMN updated_at SET DEFAULT NOW();
