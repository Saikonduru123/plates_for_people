#!/bin/bash
# Database Backup Script for Plates for People
# This script creates a timestamped backup of the PostgreSQL database

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
echo "✅ Old backups cleaned up (removed files older than 30 days)"

# Display backup size
BACKUP_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo "Backup size: $BACKUP_SIZE"
