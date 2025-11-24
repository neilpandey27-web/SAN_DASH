# 🚀 Quick Start Guide

## First Time Setup (Do Once)

### 1. Start the Application

```bash
docker-compose up -d
```

Wait 10-15 seconds for all services to start.

### 2. Create Admin User (ONE TIME ONLY)

```bash
./create_admin_auto.sh
```

**Credentials created:**
- Username: `admin`
- Password: `admin123`

### 3. Login and Upload Data (ONE TIME)

1. Open browser: http://localhost:3000
2. Login with: `admin` / `admin123`
3. Click "Upload" button
4. Select `DATA.xlsx` file
5. Wait for upload to complete

**Done!** Your data is now stored permanently in PostgreSQL.

---

## Every Day After (Normal Usage)

### Start Application

```bash
docker-compose up -d
```

### Use Application

1. Open: http://localhost:3000
2. Login: `admin` / `admin123`
3. **Your data is already there!** ✅
   - No need to recreate admin
   - No need to re-upload Excel

### Stop Application

```bash
docker-compose down
```

**Important:** Use `down` (not `down -v`) to keep your data!

---

## 💾 Data Persistence

**Your data is stored permanently in PostgreSQL:**

✅ **Admin user** - Created once, always available  
✅ **Excel data** - Uploaded once, always available  
✅ **Settings** - Saved automatically  

**Data survives:**
- Container restarts ✅
- Computer restarts ✅
- Docker Desktop restarts ✅
- `docker-compose down` ✅

**Data is deleted only if:**
- You run `docker-compose down -v` ❌
- You manually delete the postgres_data volume ❌

---

## 🔧 Useful Commands

### Check Database Status
```bash
./check_database.sh
```

Shows:
- Users count
- Uploaded data count
- Database health

### Create Backup
```bash
./backup_database.sh
```

Creates backup in `backups/` folder.

### Restore from Backup
```bash
./restore_database.sh backups/backup_file.sql
```

### Reset Admin Password
```bash
./reset_admin.sh
```

### View Logs
```bash
docker-compose logs -f backend
```

---

## ⚠️ Common Issues

### "Can't login with admin/admin123"

**Solution:**
```bash
./create_admin_auto.sh
```

This resets the password back to `admin123`.

### "No data showing in dashboard"

**Check if data exists:**
```bash
./check_database.sh
```

**If no data:** Re-upload `DATA.xlsx` from the dashboard.

### "Database connection error"

**Restart database:**
```bash
docker-compose restart db
sleep 5
docker-compose restart backend
```

---

## 📊 Access Points

- **Frontend Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:8000/api/
- **API Documentation:** http://localhost:8000/swagger/
- **Django Admin:** http://localhost:8000/admin/

---

## 📚 More Documentation

- **Database Persistence:** `DATABASE_PERSISTENCE_GUIDE.md`
- **Admin Login Help:** `ADMIN_LOGIN_HELP.md`
- **Full Setup Guide:** `SETUP_GUIDE.md`
- **Project Details:** `README.md`

---

## 🎯 Remember

1. **Create admin once** - Stored in database
2. **Upload Excel once** - Stored in database
3. **Start/stop normally** - Data persists
4. **Never use `-v` flag** with docker-compose down

**That's it!** Your Storage Analytics Dashboard is ready to use! 🎉
