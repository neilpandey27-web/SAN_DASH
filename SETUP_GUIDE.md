# Storage Analytics POC - Setup Guide

## 📍 Project Location
```
/home/user/webapp/ana/
```

## 🎯 Quick Start (3 Steps)

### Step 1: Start the Application
```bash
cd /home/user/webapp/ana
docker-compose up --build
```

Or use the convenience script:
```bash
./start.sh
```

### Step 2: Create Admin User
In a new terminal:
```bash
docker-compose exec backend python manage.py createsuperuser
```

Create credentials:
- Username: `admin`
- Email: `admin@example.com`
- Password: `admin` (or your choice)

### Step 3: Access and Use
1. Open http://localhost:3000
2. Login with your admin credentials
3. Upload the `DATA.xlsx` file from project root
4. Explore the dashboard!

## 🔗 Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React dashboard |
| Backend API | http://localhost:8000/api/ | REST API |
| Swagger Docs | http://localhost:8000/swagger/ | API documentation |
| ReDoc | http://localhost:8000/redoc/ | Alternative API docs |
| Django Admin | http://localhost:8000/admin/ | Django admin panel |

## 📊 Dashboard Features

### Level 1: Overall View
- Summary tiles (Allocated, Utilized, Available, Avg Utilization)
- Pie chart showing pool distribution
- Bar chart showing top 10 tenants
- Table of all pools (click to drill down)

### Level 2: Pool View
- All tenants within selected pool
- Tenant metrics and utilization
- Click tenant to view volumes

### Level 3: Volume View
- Individual volumes for selected tenant
- Detailed volume metrics
- System, size, utilization data

## 🛠️ Useful Commands

### Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Rebuild after code changes
docker-compose up --build
```

### Django Commands
```bash
# Django shell
docker-compose exec backend python manage.py shell

# Make migrations
docker-compose exec backend python manage.py makemigrations

# Apply migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Collect static files
docker-compose exec backend python manage.py collectstatic
```

### Database Commands
```bash
# Access PostgreSQL
docker-compose exec db psql -U user -d storage_db

# List tables
docker-compose exec db psql -U user -d storage_db -c "\dt"

# View data
docker-compose exec db psql -U user -d storage_db -c "SELECT * FROM analytics_tenant LIMIT 5;"

# Backup database
docker-compose exec db pg_dump -U user storage_db > backup_$(date +%Y%m%d).sql

# Restore database
cat backup.sql | docker-compose exec -T db psql -U user storage_db
```

## 🐛 Troubleshooting

### Issue: Port already in use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or for port 8000
lsof -ti:8000 | xargs kill -9

# Then restart
docker-compose up
```

### Issue: Database connection failed
```bash
# Check if database is running
docker-compose ps

# Restart database
docker-compose restart db

# View database logs
docker-compose logs db
```

### Issue: Frontend not loading
```bash
# Check if frontend is running
docker-compose ps

# Rebuild frontend
docker-compose up --build frontend

# View frontend logs
docker-compose logs -f frontend
```

### Issue: Cannot upload file
1. Ensure you're logged in as admin (is_superuser=True)
2. Check file format (must be .xlsx or .csv)
3. Verify file has required columns
4. Check backend logs: `docker-compose logs backend`

### Issue: No data in dashboard
1. Upload data file first (admin only)
2. Check if import was successful
3. View backend logs for errors
4. Verify database has data:
   ```bash
   docker-compose exec db psql -U user -d storage_db -c "SELECT COUNT(*) FROM analytics_tenant;"
   ```

## 📝 Data File Format

Required columns in Excel/CSV:
- `Volume`: Volume name (format: tenant_name_volume_id)
- `System`: Storage system name
- `Volume Size (GB)`: Size in GB
- `Written by Host (%)`: Utilization percentage (0-100)
- `Child Pool` or `Pool`: Pool name

Example:
| Volume | System | Volume Size (GB) | Written by Host (%) | Child Pool |
|--------|--------|------------------|---------------------|------------|
| ABC_CORP_001 | SYS1 | 1000 | 75 | POOL_A |
| ABC_CORP_002 | SYS1 | 500 | 60 | POOL_A |

## 🔒 Security Notes

⚠️ **Development Setup Only**
- Default credentials in code
- DEBUG mode enabled
- No HTTPS
- Simplified authentication

**For Production:**
- Change all default passwords
- Set DEBUG=False
- Use environment variables for secrets
- Enable HTTPS
- Add rate limiting
- Implement proper logging
- Use strong SECRET_KEY

## 📦 Technology Stack

**Backend:**
- Django 5.0.1
- Django REST Framework 3.14.0
- PostgreSQL 13
- Pandas 2.1.4 (data processing)
- OpenPyXL 3.1.2 (Excel parsing)

**Frontend:**
- React 18.2.0
- Carbon Design System 1.0.0
- Chart.js 4.4.1
- Axios 1.6.5

**Infrastructure:**
- Docker & Docker Compose
- Python 3.12
- Node.js 20

## 🎓 Learning Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [Carbon Design System](https://carbondesignsystem.com/)
- [Docker Documentation](https://docs.docker.com/)

## 📞 Getting Help

1. Check this guide first
2. View application logs: `docker-compose logs`
3. Check Swagger docs: http://localhost:8000/swagger/
4. Review browser console for frontend errors
5. Verify Docker containers are running: `docker-compose ps`

## 🎉 Next Steps

After successful setup:
1. ✅ Explore the dashboard drill-down feature
2. ✅ Try uploading your own data files
3. ✅ Review the Swagger API documentation
4. ✅ Customize the frontend styling
5. ✅ Add new API endpoints if needed
6. ✅ Implement additional features

## 📄 Additional Files

- `README.md` - Comprehensive project documentation
- `.gitignore` - Git ignore rules
- `.env.example` - Environment variable template
- `start.sh` - Quick start script
- `DATA.xlsx` - Sample data file

---

**Happy Analyzing! 📊**
