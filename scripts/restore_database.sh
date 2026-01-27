#!/bin/bash
# Database Restore Script for Plates for People
# This script restores the database from a backup file

if [ -z "$1" ]; then
    echo "Usage: ./restore_database.sh <backup_file.sql>"
    echo "Example: ./restore_database.sh /home/whirldata/plates_for_people/backups/db_backup_20260127_120000.sql"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="plates_for_people"
DB_USER="postgres"
DB_HOST="127.0.0.1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will restore the database from: $BACKUP_FILE"
echo "⚠️  All current data will be replaced!"
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
