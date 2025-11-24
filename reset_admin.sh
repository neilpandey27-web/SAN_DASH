#!/bin/bash
# Reset admin password for Storage Analytics Dashboard

echo "🔐 Admin Password Reset Tool"
echo "=============================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "❌ Containers are not running. Starting them now..."
    docker-compose up -d
    echo "⏳ Waiting for services to be ready..."
    sleep 15
fi

echo "Choose an option:"
echo "1) Reset password for existing admin user"
echo "2) Create a new superuser"
echo ""
read -p "Enter your choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "📝 Resetting password for 'admin' user..."
    docker-compose exec backend python manage.py changepassword admin
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "📝 Creating a new superuser..."
    echo "You'll be prompted for username, email, and password."
    docker-compose exec backend python manage.py createsuperuser
    
else
    echo "❌ Invalid choice. Please run the script again."
    exit 1
fi

echo ""
echo "✅ Done! You can now login at http://localhost:3000"
