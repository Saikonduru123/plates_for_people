#!/bin/bash
# Database Health Check Script
# Monitors database size, connections, and performance

DB_NAME="plates_for_people"
DB_USER="postgres"
DB_HOST="127.0.0.1"

echo "================================"
echo "Database Health Report"
echo "Generated: $(date)"
echo "================================"
echo ""

# Database Size
echo "📊 Database Size:"
PGPASSWORD='Newborn@123' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT 
    pg_size_pretty(pg_database_size('plates_for_people')) AS database_size;
"

# Table Sizes
echo ""
echo "📋 Top 5 Largest Tables:"
PGPASSWORD='Newborn@123' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size('public.'||tablename) DESC
LIMIT 5;
"

# Active Connections
echo ""
echo "🔌 Active Connections:"
PGPASSWORD='Newborn@123' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT 
    count(*) as connection_count,
    state
FROM pg_stat_activity
WHERE datname = 'plates_for_people'
GROUP BY state;
"

# Record Counts
echo ""
echo "📈 Record Counts:"
PGPASSWORD='Newborn@123' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
SELECT 'Users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'Donations', count(*) FROM donation_requests
UNION ALL
SELECT 'NGOs', count(*) FROM ngo_profiles
UNION ALL
SELECT 'Notifications', count(*) FROM notifications;
"

echo ""
echo "================================"
echo "Health check completed"
echo "================================"
