#!/bin/bash
# Backup PostgreSQL database with user data and uploaded Excel data

echo "💾 Database Backup Tool"
echo "======================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if containers are running
if ! docker-compose ps | grep -q "db.*Up"; then
    echo "❌ Database container is not running."
    echo "Start it with: docker-compose up -d"
    exit 1
fi

# Create backups directory if it doesn't exist
mkdir -p backups

# Generate backup filename with timestamp
BACKUP_FILE="backups/storage_db_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📁 Creating backup..."
echo "   File: $BACKUP_FILE"
echo ""

# Create backup
docker-compose exec -T db pg_dump -U user storage_db > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo "✅ Backup created successfully!"
    echo ""
    echo "📊 Backup Details:"
    echo "   Location: $BACKUP_FILE"
    echo "   Size: $SIZE"
    echo ""
    
    # Show what's in the backup
    echo "📋 Database Contents:"
    docker-compose exec db psql -U user -d storage_db -t -c "SELECT COUNT(*) FROM auth_user;" | xargs echo "   Users:" 
    docker-compose exec db psql -U user -d storage_db -t -c "SELECT COUNT(*) FROM storage_data;" | xargs echo "   Storage Records:"
    echo ""
    
    echo "💡 To restore this backup later:"
    echo "   ./restore_database.sh $BACKUP_FILE"
    echo ""
    
    # List all backups
    echo "📚 All Backups:"
    ls -lh backups/*.sql 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'
else
    echo "❌ Backup failed!"
    exit 1
fi
