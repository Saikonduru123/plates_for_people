# Database Changes and Backup Documentation

## Database Information

- **Database Name**: plates_for_people
- **Database Type**: PostgreSQL
- **Host**: 127.0.0.1
- **Port**: 5432
- **User**: postgres

---

## Database Schema Overview

### Tables Created

1. **users** - Base authentication table
2. **donor_profiles** - Donor information
3. **ngo_profiles** - NGO organization details
4. **ngo_locations** - NGO service locations
5. **ngo_location_capacity** - Meal capacity by location and type
6. **donation_requests** - Donation submissions
7. **ratings** - NGO ratings by donors
8. **notifications** - User notifications
9. **audit_logs** - System audit trail

---

## Database Backup Scripts

### 1. Full Database Backup

```bash
#!/bin/bash
# File: backup_database.sh

# Configuration
DB_NAME="plates_for_people"
DB_USER="postgres"
DB_HOST="127.0.0.1"
BACKUP_DIR="/home/whirldata/plates_for_people/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "Starting backup of database: $DB_NAME"
PGPASSWORD='Newborn@123' pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F p -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully: $BACKUP_FILE"
    # Compress the backup
    gzip "$BACKUP_FILE"
    echo "✅ Backup compressed: ${BACKUP_FILE}.gz"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete
echo "✅ Old backups cleaned up"
```

### 2. Restore Database from Backup

```bash
#!/bin/bash
# File: restore_database.sh

if [ -z "$1" ]; then
    echo "Usage: ./restore_database.sh <backup_file.sql>"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="plates_for_people"
DB_USER="postgres"
DB_HOST="127.0.0.1"

echo "⚠️  WARNING: This will restore the database from: $BACKUP_FILE"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup..."
    gunzip -k "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Restore database
echo "Starting restore..."
PGPASSWORD='Newborn@123' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
else
    echo "❌ Restore failed!"
    exit 1
fi
```

---

## Database Schema Changes (Migrations)

### Recent ALTER Statements Applied

#### 1. Notification System Enhancements

```sql
-- No ALTER needed, table structure was correct from initial migration
-- notifications table already has all required columns
```

#### 2. Donation Date Filtering Fix

```sql
-- No schema change required
-- Fixed application logic to filter by donation_date instead of created_at
```

#### 3. Admin Notification Improvements

```sql
-- No schema changes
-- Fixed notification creation logic in application code
```

---

## Common Database Operations

### Check Database Size

```bash
#!/bin/bash
PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -d plates_for_people -c "
SELECT
    pg_size_pretty(pg_database_size('plates_for_people')) AS database_size;
"
```

### Check Table Sizes

```bash
#!/bin/bash
PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -d plates_for_people -c "
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### View Recent Donations

```bash
#!/bin/bash
PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -d plates_for_people -c "
SELECT
    id,
    donor_id,
    ngo_location_id,
    donation_date,
    status,
    created_at
FROM donation_requests
ORDER BY created_at DESC
LIMIT 10;
"
```

### View Notification Counts by User

```bash
#!/bin/bash
PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -d plates_for_people -c "
SELECT
    u.email,
    u.role,
    COUNT(*) as total_notifications,
    SUM(CASE WHEN n.is_read = false THEN 1 ELSE 0 END) as unread_count
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id
GROUP BY u.id, u.email, u.role
ORDER BY unread_count DESC;
"
```

### View NGO Registration Status

```bash
#!/bin/bash
PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -d plates_for_people -c "
SELECT
    organization_name,
    verification_status,
    created_at,
    verified_at
FROM ngo_profiles
ORDER BY created_at DESC;
"
```

---

## Database Maintenance Scripts

### 1. Vacuum and Analyze

```bash
#!/bin/bash
# File: vacuum_database.sh

echo "Running VACUUM ANALYZE on plates_for_people..."
PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -d plates_for_people -c "VACUUM ANALYZE;"

if [ $? -eq 0 ]; then
    echo "✅ Database maintenance completed"
else
    echo "❌ Maintenance failed"
    exit 1
fi
```

### 2. Check Database Connections

```bash
#!/bin/bash
# File: check_connections.sh

PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -d plates_for_people -c "
SELECT
    datname,
    usename,
    application_name,
    client_addr,
    state,
    query_start
FROM pg_stat_activity
WHERE datname = 'plates_for_people';
"
```

---

## Automated Backup Cron Job

Add to crontab for automatic daily backups:

```bash
# Edit crontab
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /home/whirldata/plates_for_people/scripts/backup_database.sh >> /home/whirldata/plates_for_people/logs/backup.log 2>&1
```

---

## Database Schema Export

### Export Schema Only (No Data)

```bash
#!/bin/bash
PGPASSWORD='Newborn@123' pg_dump -h 127.0.0.1 -U postgres -d plates_for_people \
  --schema-only -f schema_only_$(date +%Y%m%d).sql
```

### Export Data Only (No Schema)

```bash
#!/bin/bash
PGPASSWORD='Newborn@123' pg_dump -h 127.0.0.1 -U postgres -d plates_for_people \
  --data-only -f data_only_$(date +%Y%m%d).sql
```

---

## Emergency Recovery Procedures

### 1. Quick Database Reset (Development Only)

```bash
#!/bin/bash
# ⚠️ WARNING: This will delete all data!

echo "⚠️  This will DROP and recreate the database!"
read -p "Are you sure? Type 'DELETE ALL DATA' to confirm: " confirm

if [ "$confirm" != "DELETE ALL DATA" ]; then
    echo "Cancelled."
    exit 0
fi

# Drop and recreate database
PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -c "DROP DATABASE IF EXISTS plates_for_people;"
PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE plates_for_people;"

echo "Database reset. Run migrations to recreate tables."
cd /home/whirldata/plates_for_people/backend
python3 -c "from app.core.database import init_db; import asyncio; asyncio.run(init_db())"
```

### 2. Create Test Data

```bash
#!/bin/bash
cd /home/whirldata/plates_for_people/backend
python3 create_test_donations.py
python3 create_ngo_users.py
```

---

## Monitoring and Alerts

### Database Health Check Script

```bash
#!/bin/bash
# File: health_check.sh

DB_SIZE=$(PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -d plates_for_people -t -c "SELECT pg_database_size('plates_for_people')/1024/1024;")
CONNECTIONS=$(PGPASSWORD='Newborn@123' psql -h 127.0.0.1 -U postgres -d plates_for_people -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'plates_for_people';")

echo "Database Health Report - $(date)"
echo "================================"
echo "Database Size: ${DB_SIZE} MB"
echo "Active Connections: $CONNECTIONS"

# Alert if size exceeds 1GB
if [ $(echo "$DB_SIZE > 1024" | bc) -eq 1 ]; then
    echo "⚠️  WARNING: Database size exceeds 1GB"
fi

# Alert if connections exceed 50
if [ $CONNECTIONS -gt 50 ]; then
    echo "⚠️  WARNING: High number of connections"
fi
```

---

## Change Log

### 2026-01-27

- Fixed notification service to use async SQLAlchemy syntax
- Updated `notify_admins_ngo_registration()` to use `select()` instead of `db.query()`
- Updated `notify_admins_location_added()` to use `select()` instead of `db.query()`
- Fixed admin notification count not increasing on NGO registration

### 2026-01-26

- Fixed admin reports date filtering to use `donation_date` instead of `created_at`
- Added `donor_name` to donations API response
- Improved date filtering logic in frontend

### Earlier Changes

- Initial database schema creation
- All tables created via SQLAlchemy models
- Enums defined for user roles, donation status, meal types, verification status

---

## Notes

1. **Always backup before major changes**
2. **Test restore procedures periodically**
3. **Monitor database size growth**
4. **Review slow queries regularly**
5. **Keep backup retention policy: 30 days**
6. **Database password should be stored in .env file, not in scripts**

---

## Contact & Support

For database issues or questions, check:

- Application logs: `/home/whirldata/plates_for_people/backend/logs/`
- PostgreSQL logs: Check with `sudo journalctl -u postgresql`
