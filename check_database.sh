#!/bin/bash
# Check database status and contents

echo "🔍 Database Status Check"
echo "========================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running."
    exit 1
fi

# Check if containers are running
if ! docker-compose ps | grep -q "db.*Up"; then
    echo "❌ Database container is not running."
    echo "Start it with: docker-compose up -d"
    exit 1
fi

echo "✅ Database container is running"
echo ""

# Check volume
echo "💾 Storage Volume:"
docker volume ls | grep postgres | sed 's/^/   /'
echo ""

# Check database connection
echo "🔌 Database Connection:"
if docker-compose exec db psql -U user -d storage_db -c "SELECT version();" > /dev/null 2>&1; then
    echo "   ✅ Connected successfully"
else
    echo "   ❌ Connection failed"
    exit 1
fi
echo ""

# Check tables
echo "📊 Database Tables:"
docker-compose exec db psql -U user -d storage_db -t -c "\dt" | grep -E "auth_user|storage_data" | sed 's/^/   /'
echo ""

# Check data counts
echo "📈 Data Summary:"
USER_COUNT=$(docker-compose exec db psql -U user -d storage_db -t -c "SELECT COUNT(*) FROM auth_user;" 2>/dev/null | xargs)
STORAGE_COUNT=$(docker-compose exec db psql -U user -d storage_db -t -c "SELECT COUNT(*) FROM storage_data;" 2>/dev/null | xargs)

echo "   Users: $USER_COUNT"
echo "   Storage Records: $STORAGE_COUNT"
echo ""

# List admin users
echo "👤 Admin Users:"
docker-compose exec db psql -U user -d storage_db -t -c "SELECT username, email, is_superuser, date_joined FROM auth_user WHERE is_superuser = true;" 2>/dev/null | sed 's/^/   /' || echo "   None found"
echo ""

# Storage data sample
if [ "$STORAGE_COUNT" -gt "0" ]; then
    echo "📦 Sample Storage Data (first 5 records):"
    docker-compose exec db psql -U user -d storage_db -t -c "SELECT volume, pool, volume_size_gb, utilized_gb FROM storage_data LIMIT 5;" 2>/dev/null | sed 's/^/   /'
    echo ""
fi

# Backup info
if [ -d "backups" ]; then
    BACKUP_COUNT=$(ls -1 backups/*.sql 2>/dev/null | wc -l)
    echo "💾 Backups Available: $BACKUP_COUNT"
    if [ $BACKUP_COUNT -gt 0 ]; then
        echo "   Latest backup:"
        ls -lt backups/*.sql 2>/dev/null | head -1 | awk '{print "   " $9 " (" $6 " " $7 " " $8 ")"}'
    fi
    echo ""
fi

echo "✅ Database check complete!"
echo ""
echo "💡 Available commands:"
echo "   ./backup_database.sh     - Create backup"
echo "   ./restore_database.sh    - Restore from backup"
echo "   ./create_admin_auto.sh   - Create/reset admin user"
