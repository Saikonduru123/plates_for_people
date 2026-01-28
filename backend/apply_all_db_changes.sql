-- =====================================================
-- Plates for People - Complete Database Schema
-- Apply all changes and migrations
-- Date: 2026-01-27
-- =====================================================

-- Run this file in PostgreSQL:
-- psql -h localhost -U postgres -d plates_for_people -f apply_all_db_changes.sql

BEGIN;

-- =====================================================
-- STEP 1: Create Enums
-- =====================================================

DO $$ 
BEGIN
    -- UserRole enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
        CREATE TYPE userrole AS ENUM ('donor', 'ngo', 'admin');
    END IF;

    -- NGO Verification Status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ngoverificationstatus') THEN
        CREATE TYPE ngoverificationstatus AS ENUM ('pending', 'verified', 'rejected');
    END IF;

    -- Donation Status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'donationstatus') THEN
        CREATE TYPE donationstatus AS ENUM ('pending', 'confirmed', 'rejected', 'completed', 'cancelled');
    END IF;

    -- Meal Type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mealtype') THEN
        CREATE TYPE mealtype AS ENUM ('breakfast', 'lunch', 'snacks', 'dinner');
    ELSE
        -- Add snacks if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'snacks' AND enumtypid = 'mealtype'::regtype) THEN
            ALTER TYPE mealtype ADD VALUE 'snacks';
        END IF;
    END IF;
END $$;

-- =====================================================
-- STEP 2: Create Tables (if not exists)
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role userrole NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Donor Profiles table
CREATE TABLE IF NOT EXISTS donor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_donor_profiles_user ON donor_profiles(user_id);

-- NGO Profiles table
CREATE TABLE IF NOT EXISTS ngo_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    registration_certificate_url VARCHAR(500),
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    description TEXT,
    verification_status ngoverificationstatus DEFAULT 'pending' NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by INTEGER REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ngo_profiles_user ON ngo_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ngo_profiles_verification ON ngo_profiles(verification_status);

-- NGO Locations table
CREATE TABLE IF NOT EXISTS ngo_locations (
    id SERIAL PRIMARY KEY,
    ngo_id INTEGER NOT NULL REFERENCES ngo_profiles(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    operating_hours VARCHAR(255),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_ngo_locations_ngo ON ngo_locations(ngo_id);
CREATE INDEX IF NOT EXISTS idx_ngo_locations_active ON ngo_locations(is_active);

-- NGO Location Capacity table
CREATE TABLE IF NOT EXISTS ngo_location_capacity (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL REFERENCES ngo_locations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type mealtype NOT NULL,
    capacity INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_location_capacity_lookup ON ngo_location_capacity(location_id, date, meal_type);
CREATE INDEX IF NOT EXISTS idx_location_capacity_date ON ngo_location_capacity(location_id, date);

-- Donation Requests table
CREATE TABLE IF NOT EXISTS donation_requests (
    id SERIAL PRIMARY KEY,
    donor_id INTEGER NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
    ngo_location_id INTEGER NOT NULL REFERENCES ngo_locations(id) ON DELETE CASCADE,
    food_type VARCHAR(255) NOT NULL,
    meal_type mealtype NOT NULL,
    quantity_plates INTEGER NOT NULL,
    donation_date DATE NOT NULL,
    pickup_time_start TIME NOT NULL,
    pickup_time_end TIME NOT NULL,
    description TEXT,
    special_instructions TEXT,
    status donationstatus DEFAULT 'pending' NOT NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_donation_requests_donor ON donation_requests(donor_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_ngo_location ON donation_requests(ngo_location_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_status ON donation_requests(status);
CREATE INDEX IF NOT EXISTS idx_donation_requests_date ON donation_requests(donation_date);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    donation_id INTEGER UNIQUE NOT NULL REFERENCES donation_requests(id) ON DELETE CASCADE,
    donor_id INTEGER NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
    ngo_id INTEGER NOT NULL REFERENCES ngo_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ratings_donation ON ratings(donation_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ngo ON ratings(ngo_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    changes JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- =====================================================
-- STEP 3: Add Meal-Type Capacity Columns to ngo_locations
-- =====================================================

DO $$
BEGIN
    -- Add default capacity columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_locations' AND column_name = 'default_breakfast_capacity') THEN
        ALTER TABLE ngo_locations ADD COLUMN default_breakfast_capacity INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_locations' AND column_name = 'default_lunch_capacity') THEN
        ALTER TABLE ngo_locations ADD COLUMN default_lunch_capacity INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_locations' AND column_name = 'default_snacks_capacity') THEN
        ALTER TABLE ngo_locations ADD COLUMN default_snacks_capacity INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_locations' AND column_name = 'default_dinner_capacity') THEN
        ALTER TABLE ngo_locations ADD COLUMN default_dinner_capacity INTEGER DEFAULT 0;
    END IF;
END $$;

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
END $$;

-- =====================================================
-- STEP 4: Clean up ngo_location_capacity table
-- =====================================================

-- Rename columns if needed
DO $$
BEGIN
    -- Rename total_capacity to capacity if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_location_capacity' AND column_name = 'total_capacity') THEN
        ALTER TABLE ngo_location_capacity RENAME COLUMN total_capacity TO capacity;
    END IF;
    
    -- Drop old columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_location_capacity' AND column_name = 'available_capacity') THEN
        ALTER TABLE ngo_location_capacity DROP COLUMN available_capacity;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ngo_location_capacity' AND column_name = 'current_capacity') THEN
        ALTER TABLE ngo_location_capacity DROP COLUMN current_capacity;
    END IF;
END $$;

-- Add check constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_capacity' AND conrelid = 'ngo_location_capacity'::regclass) THEN
        ALTER TABLE ngo_location_capacity ADD CONSTRAINT positive_capacity CHECK (capacity >= 0);
    END IF;
END $$;

-- =====================================================
-- STEP 5: Verify Schema
-- =====================================================

-- Show table counts
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'donor_profiles', COUNT(*) FROM donor_profiles
UNION ALL
SELECT 'ngo_profiles', COUNT(*) FROM ngo_profiles
UNION ALL
SELECT 'ngo_locations', COUNT(*) FROM ngo_locations
UNION ALL
SELECT 'ngo_location_capacity', COUNT(*) FROM ngo_location_capacity
UNION ALL
SELECT 'donation_requests', COUNT(*) FROM donation_requests
UNION ALL
SELECT 'ratings', COUNT(*) FROM ratings
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;

COMMIT;

-- =====================================================
-- Migration Complete
-- =====================================================

\echo '✅ Database schema updated successfully!'
\echo 'All tables, indexes, and constraints are in place.'
