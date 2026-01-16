#!/bin/bash
# Database initialization script for Plates for People

set -e

echo "🗄️  Initializing PostgreSQL database..."

# Configuration
DB_NAME="plates_for_people"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Check if database exists
if psql -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "⚠️  Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Dropping database '$DB_NAME'..."
        psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
    else
        echo "ℹ️  Using existing database"
        exit 0
    fi
fi

# Create database
echo "📦 Creating database '$DB_NAME'..."
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

echo "✅ Database created successfully!"
echo ""
echo "📝 Database Details:"
echo "   Name: $DB_NAME"
echo "   User: $DB_USER"
echo "   Host: localhost"
echo "   Port: 5432"
echo ""
echo "📋 Connection String:"
echo "   postgresql+asyncpg://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "🚀 Next steps:"
echo "   1. Update backend/.env with database credentials"
echo "   2. Run: cd backend && source ../.venv/bin/activate"
echo "   3. Run: python -m alembic upgrade head (for migrations)"
echo "   4. Run: python -m app.main (to start the server)"
