# 🚀 Quick Reference - Storage Analytics POC

## 📍 Location
```
/home/user/webapp/ana/
```

## ⚡ Essential Commands

### Start Application
```bash
cd /home/user/webapp/ana
./start.sh
# OR
docker-compose up --build
```

### Create Admin User (First Time)
```bash
docker-compose exec backend python manage.py createsuperuser
# Username: admin
# Password: admin
```

### Stop Application
```bash
docker-compose down
```

## 🔗 URLs
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000/api/
- **Swagger**: http://localhost:8000/swagger/
- **Admin**: http://localhost:8000/admin/

## 📊 Upload Data
1. Login as admin at http://localhost:3000
2. Click upload section
3. Upload `DATA.xlsx` from project root
4. View dashboard

## 🔧 Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart backend
docker-compose restart backend

# Django shell
docker-compose exec backend python manage.py shell

# Database access
docker-compose exec db psql -U user -d storage_db

# Rebuild
docker-compose up --build
```

## 📚 Documentation
- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Detailed setup
- `PROJECT_SUMMARY.md` - Overview

## 🐛 Quick Fixes

### Port in use
```bash
lsof -ti:3000 | xargs kill -9
docker-compose up
```

### Database reset
```bash
docker-compose down -v
docker-compose up --build
# Then create superuser again
```

### View errors
```bash
docker-compose logs backend
docker-compose logs frontend
```

## 🎯 Default Credentials
- Username: `admin`
- Password: `admin`
- (Create with createsuperuser command)

## ✅ Quick Check
```bash
# All services running?
docker-compose ps

# Database has data?
docker-compose exec db psql -U user -d storage_db -c "SELECT COUNT(*) FROM analytics_tenant;"
```

---
**Version**: 1.0.0 | **Status**: ✅ Ready
