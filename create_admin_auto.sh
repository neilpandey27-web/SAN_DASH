#!/bin/bash
# Automatically create admin user with default credentials

echo "🔐 Auto-creating admin user..."
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

# Create admin user automatically using Django shell
echo "📝 Creating admin user with default credentials..."
docker-compose exec -T backend python manage.py shell << EOF
from django.contrib.auth.models import User
import sys

try:
    # Try to get existing admin user
    user = User.objects.get(username='admin')
    print("✅ Admin user already exists!")
    print("   Username: admin")
    print("   Resetting password to: admin123")
    user.set_password('admin123')
    user.save()
    print("✅ Password reset successfully!")
except User.DoesNotExist:
    # Create new admin user
    user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("✅ Admin user created successfully!")
    print("   Username: admin")
    print("   Email: admin@example.com")
    print("   Password: admin123")

sys.exit(0)
EOF

echo ""
echo "=============================="
echo "✅ Setup Complete!"
echo ""
echo "📍 Login Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🌐 Access the app at: http://localhost:3000"
echo ""
echo "⚠️  Remember to change the password after first login!"
