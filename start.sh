#!/bin/bash
# Quick start script for Storage Analytics POC

echo "🚀 Starting Storage Analytics POC..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Build and start containers
echo "📦 Building and starting containers..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ All services are running!"
    echo ""
    echo "📍 Access the application:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:8000"
    echo "   API Docs:  http://localhost:8000/swagger/"
    echo ""
    echo "🔐 Next steps:"
    echo "   1. Create admin user:"
    echo "      docker-compose exec backend python manage.py createsuperuser"
    echo ""
    echo "   2. Login with your credentials at http://localhost:3000"
    echo ""
    echo "   3. Upload DATA.xlsx from the project root"
    echo ""
    echo "📝 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop application:"
    echo "   docker-compose down"
else
    echo "❌ Some services failed to start. Check logs:"
    echo "   docker-compose logs"
fi
