# Database Design & ERD - Plates for People

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PLATES FOR PEOPLE - ERD                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       users          │
├──────────────────────┤
│ id (PK)             │◄──────────────┐
│ email (UNIQUE)      │               │
│ password_hash       │               │
│ role (ENUM)         │               │
│ full_name           │               │
│ phone               │               │
│ is_active           │               │
│ is_verified         │               │
│ created_at          │               │
│ updated_at          │               │
└──────────────────────┘               │
         │                             │
         │ (one-to-one)                │
         │                             │
         ▼                             │
┌──────────────────────┐               │
│   donor_profiles     │               │
├──────────────────────┤               │
│ id (PK)             │               │
│ user_id (FK) UNIQUE │───────────────┘
│ organization_name   │
│ organization_type   │
│ address             │
│ city                │
│ state               │
│ country             │
│ zip_code            │
│ government_id_type  │
│ government_id_number│
│ latitude            │
│ longitude           │
│ created_at          │
│ updated_at          │
└──────────────────────┘
         │
         │ (one-to-many)
         │
         ▼
┌──────────────────────┐
│  donation_requests   │
├──────────────────────┤
│ id (PK)             │
│ donor_id (FK)       │───────────────┐
│ ngo_location_id(FK) │               │
│ meal_type (ENUM)    │               │
│ num_plates          │               │
│ food_description    │               │
│ donation_date       │               │
│ status (ENUM)       │               │
│ notes               │               │
│ created_at          │               │
│ updated_at          │               │
│ confirmed_at        │               │
│ completed_at        │               │
└──────────────────────┘               │
         │                             │
         │ (one-to-one)                │
         │                             │
         ▼                             │
┌──────────────────────┐               │
│       ratings        │               │
├──────────────────────┤               │
│ id (PK)             │               │
│ donation_request_id │               │
│   (FK) UNIQUE       │               │
│ rating (1-5)        │               │
│ feedback_text       │               │
│ created_at          │               │
└──────────────────────┘               │
                                       │
┌──────────────────────┐               │
│    ngo_profiles      │               │
├──────────────────────┤               │
│ id (PK)             │◄──────────────┤
│ user_id (FK) UNIQUE │───────────────┤─────────┐
│ ngo_name            │               │         │
│ registration_number │               │         │
│ registration_doc_url│               │         │
│ verification_status │               │         │
│ verified_by (FK)    │───────────────┼─────────┤
│ verified_at         │               │         │
│ rejection_reason    │               │         │
│ website             │               │         │
│ description         │               │         │
│ established_year    │               │         │
│ contact_person_name │               │         │
│ contact_person_phone│               │         │
│ created_at          │               │         │
│ updated_at          │               │         │
└──────────────────────┘               │         │
         │                             │         │
         │ (one-to-many)               │         │
         │                             │         │
         ▼                             │         │
┌──────────────────────┐               │         │
│   ngo_locations      │               │         │
├──────────────────────┤               │         │
│ id (PK)             │◄──────────────┘         │
│ ngo_profile_id (FK) │                         │
│ location_name       │                         │
│ address             │                         │
│ city                │                         │
│ state               │                         │
│ country             │                         │
│ zip_code            │                         │
│ latitude            │                         │
│ longitude           │                         │
│ is_active           │                         │
│ created_at          │                         │
│ updated_at          │                         │
└──────────────────────┘                         │
         │                                       │
         │ (one-to-many)                         │
         │                                       │
         ▼                                       │
┌──────────────────────┐                         │
│ ngo_location_capacity│                         │
├──────────────────────┤                         │
│ id (PK)             │                         │
│ ngo_location_id (FK)│                         │
│ meal_type (ENUM)    │                         │
│ total_capacity      │                         │
│ available_capacity  │                         │
│ date                │                         │
│ is_available        │                         │
│ created_at          │                         │
│ updated_at          │                         │
│ UNIQUE(location,    │                         │
│   meal_type, date)  │                         │
└──────────────────────┘                         │
                                                 │
┌──────────────────────┐                         │
│   notifications      │                         │
├──────────────────────┤                         │
│ id (PK)             │                         │
│ user_id (FK)        │─────────────────────────┘
│ type (ENUM)         │
│ title               │
│ message             │
│ related_entity_type │
│ related_entity_id   │
│ is_read             │
│ created_at          │
└──────────────────────┘

┌──────────────────────┐
│    audit_logs        │
├──────────────────────┤
│ id (PK)             │
│ user_id (FK)        │─────────────────────────┘
│ action (ENUM)       │
│ entity_type         │
│ entity_id           │
│ old_values (JSONB)  │
│ new_values (JSONB)  │
│ ip_address          │
│ user_agent          │
│ created_at          │
└──────────────────────┘
```

---

## Table Definitions

### 1. users
**Purpose**: Core authentication and user management table for all user types.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address (login) |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | ENUM('donor', 'ngo', 'admin') | NOT NULL | User role for RBAC |
| full_name | VARCHAR(255) | NOT NULL | User's full name |
| phone | VARCHAR(20) | NOT NULL | Contact phone number |
| is_active | BOOLEAN | DEFAULT true | Account active status |
| is_verified | BOOLEAN | DEFAULT false | Email verification status |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` on (email)
- `idx_users_role` on (role)
- `idx_users_is_verified` on (is_verified) WHERE role = 'ngo'

**Business Rules:**
- Email must be unique across all users
- NGO users cannot login until is_verified = true
- Password must be hashed using bcrypt (cost factor 12)
- Phone numbers stored with country code

---

### 2. donor_profiles
**Purpose**: Extended profile information for food donors.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Profile identifier |
| user_id | UUID | FK → users.id, UNIQUE, NOT NULL | Reference to user account |
| organization_name | VARCHAR(255) | NULL | Restaurant/company name |
| organization_type | VARCHAR(100) | NULL | Restaurant, Catering, Individual, etc. |
| address | TEXT | NOT NULL | Street address |
| city | VARCHAR(100) | NOT NULL | City name |
| state | VARCHAR(100) | NOT NULL | State/province |
| country | VARCHAR(100) | NOT NULL | Country (US or India) |
| zip_code | VARCHAR(20) | NOT NULL | Postal code |
| government_id_type | VARCHAR(50) | NOT NULL | ID type (Aadhar, PAN, SSN, EIN) |
| government_id_number | VARCHAR(100) | NOT NULL | ID number (encrypted) |
| latitude | DECIMAL(10,8) | NULL | Location latitude |
| longitude | DECIMAL(11,8) | NULL | Location longitude |
| created_at | TIMESTAMP | DEFAULT NOW() | Profile creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_donor_profiles_user_id` on (user_id)
- `idx_donor_profiles_location` on (latitude, longitude) WHERE latitude IS NOT NULL
- `idx_donor_profiles_city_country` on (city, country)

**Business Rules:**
- One profile per donor user
- Government ID should be encrypted at application level
- Location coordinates optional but recommended
- Organization name optional (for individual donors)

---

### 3. ngo_profiles
**Purpose**: Extended profile information for NGO organizations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Profile identifier |
| user_id | UUID | FK → users.id, UNIQUE, NOT NULL | Reference to user account |
| ngo_name | VARCHAR(255) | NOT NULL | Official NGO name |
| registration_number | VARCHAR(100) | NOT NULL | Government registration number |
| registration_doc_url | TEXT | NOT NULL | Document storage URL |
| verification_status | ENUM('pending', 'approved', 'rejected') | DEFAULT 'pending' | Verification status |
| verified_by | UUID | FK → users.id, NULL | Admin who verified |
| verified_at | TIMESTAMP | NULL | Verification timestamp |
| rejection_reason | TEXT | NULL | Reason if rejected |
| website | VARCHAR(255) | NULL | NGO website |
| description | TEXT | NULL | About the NGO |
| established_year | INTEGER | NULL | Year established |
| contact_person_name | VARCHAR(255) | NOT NULL | Primary contact name |
| contact_person_phone | VARCHAR(20) | NOT NULL | Primary contact phone |
| created_at | TIMESTAMP | DEFAULT NOW() | Registration date |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_ngo_profiles_user_id` on (user_id)
- `idx_ngo_profiles_verification_status` on (verification_status)
- `idx_ngo_profiles_registration_number` on (registration_number)

**Business Rules:**
- One profile per NGO user
- Must be approved before NGO can receive requests
- Registration document must be uploaded during registration
- Verified_by must be admin user

---

### 4. ngo_locations
**Purpose**: Multiple physical locations for each NGO.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Location identifier |
| ngo_profile_id | UUID | FK → ngo_profiles.id, NOT NULL | Parent NGO |
| location_name | VARCHAR(255) | NOT NULL | Branch/location name |
| address | TEXT | NOT NULL | Street address |
| city | VARCHAR(100) | NOT NULL | City name |
| state | VARCHAR(100) | NOT NULL | State/province |
| country | VARCHAR(100) | NOT NULL | Country (US or India) |
| zip_code | VARCHAR(20) | NOT NULL | Postal code |
| latitude | DECIMAL(10,8) | NOT NULL | Location latitude |
| longitude | DECIMAL(11,8) | NOT NULL | Location longitude |
| is_active | BOOLEAN | DEFAULT true | Location active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Location added |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_ngo_locations_ngo_profile_id` on (ngo_profile_id)
- `idx_ngo_locations_coordinates` on (latitude, longitude)
- `idx_ngo_locations_city_country` on (city, country)
- `idx_ngo_locations_is_active` on (is_active) WHERE is_active = true

**Business Rules:**
- NGO can have multiple locations
- Latitude/longitude required (selected via map)
- Inactive locations don't appear in searches
- All locations use same NGO verification status

---

### 5. ngo_location_capacity
**Purpose**: Daily capacity management for each location and meal type.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Capacity record ID |
| ngo_location_id | UUID | FK → ngo_locations.id, NOT NULL | Location reference |
| meal_type | ENUM('breakfast', 'lunch', 'dinner') | NOT NULL | Meal type |
| total_capacity | INTEGER | NOT NULL, CHECK > 0 | Max plates accepted |
| available_capacity | INTEGER | NOT NULL, CHECK >= 0 | Remaining capacity |
| date | DATE | NOT NULL | Date for this capacity |
| is_available | BOOLEAN | DEFAULT true | Manual availability toggle |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |
| CONSTRAINT | UNIQUE | (ngo_location_id, meal_type, date) | One record per location/meal/date |

**Indexes:**
- `idx_capacity_location_date` on (ngo_location_id, date)
- `idx_capacity_date_available` on (date, is_available) WHERE is_available = true
- `idx_capacity_available_gt_zero` on (ngo_location_id) WHERE available_capacity > 0

**Business Rules:**
- available_capacity decreases when donation confirmed
- available_capacity increases if donation cancelled/rejected
- available_capacity cannot exceed total_capacity
- is_available=false hides from search even if capacity exists
- Records auto-created for future dates when NGO sets defaults
- Past date records are read-only (historical data)

---

### 6. donation_requests
**Purpose**: Core transaction table for donation requests and tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Request identifier |
| donor_id | UUID | FK → donor_profiles.id, NOT NULL | Donor who requested |
| ngo_location_id | UUID | FK → ngo_locations.id, NOT NULL | Target NGO location |
| meal_type | ENUM('breakfast', 'lunch', 'dinner') | NOT NULL | Meal type |
| num_plates | INTEGER | NOT NULL, CHECK > 0 | Number of plates |
| food_description | TEXT | NOT NULL | Description of food |
| donation_date | DATE | NOT NULL | Scheduled donation date |
| status | ENUM('pending', 'confirmed', 'rejected', 'completed', 'cancelled') | DEFAULT 'pending' | Request status |
| notes | TEXT | NULL | Additional notes from donor |
| created_at | TIMESTAMP | DEFAULT NOW() | Request creation |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last status change |
| confirmed_at | TIMESTAMP | NULL | When NGO confirmed |
| completed_at | TIMESTAMP | NULL | When donation completed |

**Indexes:**
- `idx_donation_donor_id` on (donor_id)
- `idx_donation_ngo_location_id` on (ngo_location_id)
- `idx_donation_status` on (status)
- `idx_donation_date_status` on (donation_date, status)
- `idx_donation_created_at` on (created_at DESC)

**Business Rules:**
- num_plates must not exceed ngo_location_capacity.available_capacity
- donation_date must be >= current date
- Status transitions: pending → confirmed/rejected → completed
- Once completed, cannot change status
- Cancelled only allowed in pending state
- confirmed_at set when status → confirmed
- completed_at set when status → completed

**Status Flow:**
```
pending → confirmed → completed
   ↓
rejected
   ↓
cancelled (only from pending)
```

---

### 7. ratings
**Purpose**: Post-donation feedback and ratings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Rating identifier |
| donation_request_id | UUID | FK → donation_requests.id, UNIQUE, NOT NULL | Related donation |
| rating | INTEGER | NOT NULL, CHECK 1-5 | Star rating |
| feedback_text | TEXT | NULL | Optional text feedback |
| created_at | TIMESTAMP | DEFAULT NOW() | Rating submission time |

**Indexes:**
- `idx_ratings_donation_request_id` on (donation_request_id)
- `idx_ratings_created_at` on (created_at DESC)

**Business Rules:**
- Only donors can rate
- Can only rate completed donations
- One rating per donation request
- Rating must be 1-5 stars
- Feedback text optional
- Ratings visible on NGO profile (aggregated)

---

### 8. notifications
**Purpose**: In-app notification system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Notification ID |
| user_id | UUID | FK → users.id, NOT NULL | Recipient user |
| type | ENUM('donation_request', 'request_confirmed', 'request_rejected', 'donation_completed', 'verification_approved', 'verification_rejected') | NOT NULL | Notification type |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| related_entity_type | VARCHAR(50) | NULL | Entity type (donation_request, ngo_profile) |
| related_entity_id | UUID | NULL | Entity ID |
| is_read | BOOLEAN | DEFAULT false | Read status |
| created_at | TIMESTAMP | DEFAULT NOW() | Notification timestamp |

**Indexes:**
- `idx_notifications_user_id` on (user_id)
- `idx_notifications_is_read` on (user_id, is_read) WHERE is_read = false
- `idx_notifications_created_at` on (created_at DESC)

**Business Rules:**
- Notifications auto-created by triggers
- Unread notifications shown with badge
- Click notification → mark as read + navigate to entity
- Notifications retained for 90 days (cleanup job)

---

### 9. audit_logs
**Purpose**: Comprehensive audit trail for compliance and debugging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Log entry ID |
| user_id | UUID | FK → users.id, NULL | User who performed action |
| action | ENUM('create', 'update', 'delete', 'login', 'logout', 'verify', 'reject') | NOT NULL | Action type |
| entity_type | VARCHAR(50) | NOT NULL | Table/entity affected |
| entity_id | UUID | NULL | Entity ID affected |
| old_values | JSONB | NULL | Previous values (for updates) |
| new_values | JSONB | NULL | New values |
| ip_address | VARCHAR(45) | NULL | User's IP address |
| user_agent | TEXT | NULL | Browser/device info |
| created_at | TIMESTAMP | DEFAULT NOW() | Action timestamp |

**Indexes:**
- `idx_audit_logs_user_id` on (user_id)
- `idx_audit_logs_entity` on (entity_type, entity_id)
- `idx_audit_logs_created_at` on (created_at DESC)
- `idx_audit_logs_action` on (action)

**Business Rules:**
- Immutable (never updated or deleted)
- Auto-created by triggers or application
- Used for compliance, debugging, security
- Sensitive data (passwords) never logged
- Partitioned by month for performance (future)

---

## Relationships Summary

### One-to-One
- `users` ↔ `donor_profiles` (user_id)
- `users` ↔ `ngo_profiles` (user_id)
- `donation_requests` ↔ `ratings` (donation_request_id)

### One-to-Many
- `ngo_profiles` → `ngo_locations` (ngo_profile_id)
- `ngo_locations` → `ngo_location_capacity` (ngo_location_id)
- `ngo_locations` → `donation_requests` (ngo_location_id)
- `donor_profiles` → `donation_requests` (donor_id)
- `users` → `notifications` (user_id)
- `users` → `audit_logs` (user_id)

### Many-to-Many
- None (design intentionally avoids complex many-to-many for MVP)

---

## Database Triggers

### 1. update_updated_at_timestamp
```sql
-- Auto-update updated_at column on any UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... (repeat for other tables)
```

### 2. update_capacity_on_donation_status_change
```sql
-- Decrease available capacity when donation confirmed
-- Increase when donation rejected/cancelled
CREATE OR REPLACE FUNCTION update_ngo_capacity()
RETURNS TRIGGER AS $$
BEGIN
    -- When donation confirmed
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        UPDATE ngo_location_capacity
        SET available_capacity = available_capacity - NEW.num_plates
        WHERE ngo_location_id = NEW.ngo_location_id
          AND meal_type = NEW.meal_type
          AND date = NEW.donation_date;
    END IF;
    
    -- When donation rejected or cancelled
    IF (NEW.status IN ('rejected', 'cancelled')) 
       AND OLD.status IN ('pending', 'confirmed') THEN
        UPDATE ngo_location_capacity
        SET available_capacity = available_capacity + 
            CASE WHEN OLD.status = 'confirmed' THEN NEW.num_plates ELSE 0 END
        WHERE ngo_location_id = NEW.ngo_location_id
          AND meal_type = NEW.meal_type
          AND date = NEW.donation_date;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donation_status_capacity_update
AFTER UPDATE OF status ON donation_requests
FOR EACH ROW EXECUTE FUNCTION update_ngo_capacity();
```

### 3. create_notification_on_events
```sql
-- Auto-create notifications for key events
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- New donation request → notify NGO
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'donation_requests' THEN
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
        SELECT np.user_id, 'donation_request', 
               'New Donation Request', 
               CONCAT('New donation request for ', NEW.num_plates, ' plates on ', NEW.donation_date),
               'donation_request', NEW.id
        FROM ngo_locations nl
        JOIN ngo_profiles np ON nl.ngo_profile_id = np.id
        WHERE nl.id = NEW.ngo_location_id;
    END IF;
    
    -- Donation confirmed → notify donor
    IF TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id)
        SELECT dp.user_id, 'request_confirmed',
               'Donation Request Confirmed',
               'Your donation request has been confirmed!',
               'donation_request', NEW.id
        FROM donor_profiles dp
        WHERE dp.id = NEW.donor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donation_request_notification
AFTER INSERT OR UPDATE ON donation_requests
FOR EACH ROW EXECUTE FUNCTION create_notification();
```

---

## Sample Queries

### 1. Find available NGOs within radius (Map Search)
```sql
-- Search NGOs within 10km radius with available capacity for lunch on 2026-01-20
SELECT 
    nl.id AS location_id,
    np.ngo_name,
    nl.location_name,
    nl.address,
    nl.city,
    nl.latitude,
    nl.longitude,
    nlc.available_capacity,
    nlc.total_capacity,
    AVG(r.rating) AS avg_rating,
    COUNT(DISTINCT dr.id) AS total_donations,
    -- Distance calculation using Haversine formula
    (6371 * acos(
        cos(radians(40.7128)) * -- Donor latitude
        cos(radians(nl.latitude)) *
        cos(radians(nl.longitude) - radians(-74.0060)) + -- Donor longitude
        sin(radians(40.7128)) *
        sin(radians(nl.latitude))
    )) AS distance_km
FROM ngo_locations nl
JOIN ngo_profiles np ON nl.ngo_profile_id = np.id
JOIN ngo_location_capacity nlc ON nl.id = nlc.ngo_location_id
LEFT JOIN donation_requests dr ON nl.id = dr.ngo_location_id AND dr.status = 'completed'
LEFT JOIN ratings r ON dr.id = r.donation_request_id
WHERE np.verification_status = 'approved'
  AND nl.is_active = TRUE
  AND nlc.date = '2026-01-20'
  AND nlc.meal_type = 'lunch'
  AND nlc.is_available = TRUE
  AND nlc.available_capacity > 0
GROUP BY nl.id, np.ngo_name, nl.location_name, nl.address, nl.city, 
         nl.latitude, nl.longitude, nlc.available_capacity, nlc.total_capacity
HAVING (6371 * acos(
    cos(radians(40.7128)) *
    cos(radians(nl.latitude)) *
    cos(radians(nl.longitude) - radians(-74.0060)) +
    sin(radians(40.7128)) *
    sin(radians(nl.latitude))
)) <= 10
ORDER BY distance_km ASC;
```

### 2. Donor Dashboard Statistics
```sql
-- Get donor dashboard stats
SELECT 
    COUNT(*) FILTER (WHERE status = 'completed') AS total_donations_completed,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_requests,
    COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_requests,
    SUM(num_plates) FILTER (WHERE status = 'completed') AS total_plates_donated,
    AVG(r.rating) AS avg_rating_received
FROM donation_requests dr
LEFT JOIN ratings r ON dr.id = r.donation_request_id
WHERE dr.donor_id = :donor_id;

-- Recent donations
SELECT 
    dr.id,
    dr.donation_date,
    dr.num_plates,
    dr.status,
    dr.meal_type,
    np.ngo_name,
    nl.location_name,
    nl.city
FROM donation_requests dr
JOIN ngo_locations nl ON dr.ngo_location_id = nl.id
JOIN ngo_profiles np ON nl.ngo_profile_id = np.id
WHERE dr.donor_id = :donor_id
ORDER BY dr.created_at DESC
LIMIT 10;
```

### 3. NGO Dashboard Statistics
```sql
-- NGO dashboard stats
SELECT 
    COUNT(*) FILTER (WHERE status = 'completed') AS total_donations_received,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_requests,
    SUM(num_plates) FILTER (WHERE status = 'completed') AS total_plates_received,
    AVG(r.rating) AS avg_rating
FROM donation_requests dr
LEFT JOIN ratings r ON dr.id = r.donation_request_id
WHERE dr.ngo_location_id IN (
    SELECT id FROM ngo_locations WHERE ngo_profile_id = :ngo_profile_id
);

-- Capacity utilization today
SELECT 
    nl.location_name,
    nlc.meal_type,
    nlc.total_capacity,
    nlc.available_capacity,
    (nlc.total_capacity - nlc.available_capacity) AS utilized_capacity,
    ROUND(((nlc.total_capacity - nlc.available_capacity)::NUMERIC / nlc.total_capacity) * 100, 2) AS utilization_percentage
FROM ngo_locations nl
JOIN ngo_location_capacity nlc ON nl.id = nlc.ngo_location_id
WHERE nl.ngo_profile_id = :ngo_profile_id
  AND nlc.date = CURRENT_DATE
ORDER BY nl.location_name, nlc.meal_type;
```

### 4. Admin Reports
```sql
-- Platform-wide donation report with filters
SELECT 
    dr.donation_date,
    dr.status,
    np.ngo_name,
    nl.city AS ngo_city,
    dp.organization_name AS donor_name,
    dp.city AS donor_city,
    dr.meal_type,
    dr.num_plates,
    r.rating,
    dr.created_at,
    dr.completed_at
FROM donation_requests dr
JOIN ngo_locations nl ON dr.ngo_location_id = nl.id
JOIN ngo_profiles np ON nl.ngo_profile_id = np.id
JOIN donor_profiles dp ON dr.donor_id = dp.id
LEFT JOIN ratings r ON dr.id = r.donation_request_id
WHERE dr.donation_date BETWEEN :start_date AND :end_date
  AND (:ngo_id IS NULL OR np.id = :ngo_id)
  AND (:donor_id IS NULL OR dp.id = :donor_id)
  AND (:status IS NULL OR dr.status = :status)
ORDER BY dr.donation_date DESC, dr.created_at DESC;

-- NGO verification queue
SELECT 
    np.id,
    np.ngo_name,
    u.email,
    np.registration_number,
    np.registration_doc_url,
    np.verification_status,
    np.created_at,
    COUNT(nl.id) AS num_locations
FROM ngo_profiles np
JOIN users u ON np.user_id = u.id
LEFT JOIN ngo_locations nl ON np.id = nl.ngo_profile_id
WHERE np.verification_status = 'pending'
GROUP BY np.id, np.ngo_name, u.email, np.registration_number, 
         np.registration_doc_url, np.verification_status, np.created_at
ORDER BY np.created_at ASC;
```

---

## Data Integrity Constraints

### Application-Level Validations
1. **Email Format**: Valid email regex
2. **Phone Format**: Country code + 10 digits (US/India)
3. **Password Strength**: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
4. **Coordinates**: Valid latitude (-90 to 90), longitude (-180 to 180)
5. **Dates**: Donation date >= current date
6. **Capacity**: num_plates <= available_capacity

### Database-Level Constraints
1. **Foreign Keys**: All FKs with ON DELETE CASCADE/RESTRICT
2. **Check Constraints**: Positive values for capacity, plates, ratings
3. **Unique Constraints**: Email, (location + meal + date)
4. **Not Null**: All required business fields

---

## Performance Optimization

### Indexing Strategy
- B-tree indexes on foreign keys and frequently filtered columns
- Composite indexes for common query patterns
- Partial indexes for filtered queries (e.g., WHERE is_active = true)
- GiST index for geo-spatial queries (future optimization)

### Query Optimization
- Use prepared statements to prevent SQL injection and improve performance
- Implement connection pooling
- Use EXPLAIN ANALYZE to optimize slow queries
- Consider materialized views for complex dashboard queries (future)

### Scalability Considerations
- Partition audit_logs by month
- Archive old donation_requests (>1 year) to separate table
- Implement read replicas for reporting queries
- Cache frequently accessed data (NGO lists, ratings) at application level

---

## Backup & Recovery Strategy
1. **Automated Backups**: Daily full backups, hourly incremental
2. **Point-in-Time Recovery**: WAL archiving enabled
3. **Backup Retention**: 30 days
4. **Test Recovery**: Monthly recovery drills
5. **Geo-Redundancy**: Backup to different region (US ↔ India)

---

## Security Considerations
1. **Encryption at Rest**: PostgreSQL TDE or disk-level encryption
2. **Encryption in Transit**: SSL/TLS for all connections
3. **Sensitive Data**: Encrypt government_id_number at application level
4. **Row-Level Security**: Future consideration for multi-tenancy
5. **SQL Injection**: Use parameterized queries exclusively
6. **Audit Trail**: All sensitive operations logged

---

## Future Enhancements (Post-MVP)
1. **Full-Text Search**: Add tsvector columns for NGO search
2. **Time-Series Data**: Track capacity trends over time
3. **Geospatial Optimization**: PostGIS extension for complex geo queries
4. **Soft Deletes**: Add deleted_at columns instead of hard deletes
5. **Versioning**: Track historical changes to NGO profiles
6. **Multi-Tenancy**: Separate schemas per region (US/India)
