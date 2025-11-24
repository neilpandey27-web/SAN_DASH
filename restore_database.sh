#!/bin/bash
# Restore PostgreSQL database from backup

echo "♻️  Database Restore Tool"
echo "========================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ No backup file specified!"
    echo ""
    echo "Usage: ./restore_database.sh <backup_file>"
    echo ""
    echo "Available backups:"
    ls -1 backups/*.sql 2>/dev/null | sed 's/^/   /'
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace all current data!"
echo "   Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Restore cancelled."
    exit 0
fi

# Check if containers are running
if ! docker-compose ps | grep -q "db.*Up"; then
    echo "📦 Starting database container..."
    docker-compose up -d db
    sleep 10
fi

echo ""
echo "📊 Current Database Contents (before restore):"
docker-compose exec db psql -U user -d storage_db -t -c "SELECT COUNT(*) FROM auth_user;" 2>/dev/null | xargs echo "   Users:" || echo "   Users: 0"
docker-compose exec db psql -U user -d storage_db -t -c "SELECT COUNT(*) FROM storage_data;" 2>/dev/null | xargs echo "   Storage Records:" || echo "   Storage Records: 0"

echo ""
echo "♻️  Restoring database..."

# Drop existing tables and restore
docker-compose exec -T db psql -U user -d storage_db << EOF
-- Drop all tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO user;
GRANT ALL ON SCHEMA public TO public;
EOF

# Restore from backup
cat "$BACKUP_FILE" | docker-compose exec -T db psql -U user -d storage_db

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database restored successfully!"
    echo ""
    echo "📊 Restored Database Contents:"
    docker-compose exec db psql -U user -d storage_db -t -c "SELECT COUNT(*) FROM auth_user;" | xargs echo "   Users:"
    docker-compose exec db psql -U user -d storage_db -t -c "SELECT COUNT(*) FROM storage_data;" | xargs echo "   Storage Records:"
    echo ""
    echo "🌐 You can now access the application at http://localhost:3000"
else
    echo "❌ Restore failed!"
    exit 1
fi
