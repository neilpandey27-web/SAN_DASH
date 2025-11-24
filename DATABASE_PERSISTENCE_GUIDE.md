# 💾 Database Persistence Guide

## ✅ Good News!

**Your application ALREADY stores everything in a database!**

- ✅ **User accounts** (admin & regular users) → PostgreSQL
- ✅ **Uploaded Excel data** → PostgreSQL
- ✅ **All storage data** → PostgreSQL

The data is stored in a **Docker volume** called `postgres_data` which persists between container restarts.

---

## 📊 What Gets Stored

### 1. User Accounts
- **Location:** Django's built-in `auth_user` table
- **Includes:** Username, email, password (hashed), permissions
- **Created by:** `createsuperuser` command or registration

### 2. Uploaded Excel Data
- **Location:** `storage_data` table in PostgreSQL
- **Includes:** Volume names, pools, utilization, sizes
- **Uploaded via:** Dashboard upload feature (admin only)

### 3. Session Data
- **Location:** Django sessions table
- **Keeps you logged in** across browser restarts

---

## 🔍 Why You Might Lose Data

### Common Causes:

1. **Running `docker-compose down -v`** ❌
   - The `-v` flag **DELETES volumes** (including database!)
   - This wipes all data permanently

2. **Running `docker volume rm`** ❌
   - Manually deleting the `postgres_data` volume

3. **Recreating containers without volume** ❌
   - Changing docker-compose.yml volume configuration

---

## ✅ How to Keep Your Data Safe

### DO: Safe Commands (Keeps Data)

```bash
# Stop containers but KEEP data
docker-compose down

# Stop containers (keeps data)
docker-compose stop

# Restart containers (keeps data)
docker-compose restart

# Start containers again (data is still there)
docker-compose up -d
```

### DON'T: Dangerous Commands (Deletes Data)

```bash
# ❌ DANGER: Deletes all data!
docker-compose down -v

# ❌ DANGER: Deletes specific volume
docker volume rm postgres_data

# ❌ DANGER: Deletes everything
docker system prune -a --volumes
```

---

## 🔄 Normal Workflow (Data Persists)

### First Time Setup:

1. **Start application:**
   ```bash
   docker-compose up -d
   ```

2. **Create admin user (ONE TIME ONLY):**
   ```bash
   ./create_admin_auto.sh
   ```
   - Username: `admin`
   - Password: `admin123`

3. **Login and upload Excel data (ONE TIME):**
   - Go to http://localhost:3000
   - Login with admin/admin123
   - Upload `DATA.xlsx`

### Every Day After:

1. **Start application:**
   ```bash
   docker-compose up -d
   ```

2. **Login:**
   - Go to http://localhost:3000
   - Use same credentials: `admin` / `admin123`
   - **Your data is already there!** ✅

3. **Stop when done:**
   ```bash
   docker-compose down  # WITHOUT -v flag!
   ```

---

## 🔐 Verify Data Persistence

### Check if Volume Exists:

```bash
docker volume ls | grep postgres
```

You should see:
```
local     san_storage_dashboard_postgres_data
```

### Check Database Contents:

```bash
# Connect to database
docker-compose exec db psql -U user -d storage_db

# List all tables
\dt

# Count users
SELECT COUNT(*) FROM auth_user;

# Count uploaded data
SELECT COUNT(*) FROM storage_data;

# Exit
\q
```

---

## 💾 Backup Your Data

### Create Backup:

```bash
# Create backup file
docker-compose exec db pg_dump -U user storage_db > backup_$(date +%Y%m%d).sql

# This creates: backup_20251122.sql
```

### Restore from Backup:

```bash
# Restore data
docker-compose exec -T db psql -U user storage_db < backup_20251122.sql
```

---

## 🆘 Data Recovery Scenarios

### Scenario 1: Accidentally Ran `docker-compose down -v`

**Data is GONE.** You need to:
1. Recreate admin user: `./create_admin_auto.sh`
2. Re-upload Excel data from `DATA.xlsx`

**Prevention:** Use `docker-compose down` (without `-v`)

### Scenario 2: Volume Still Exists But Can't Login

**Data is SAFE.** Just reset password:
```bash
./reset_admin.sh
```

### Scenario 3: Moved Project Folder

**Data might be in old volume.** Check:
```bash
docker volume ls
```

Look for old project volumes and restore:
```bash
# List all postgres volumes
docker volume ls | grep postgres

# If found, update docker-compose.yml to use old volume
```

---

## 📋 Database Schema

### Tables Created:

1. **auth_user** - Django users (admin, regular users)
2. **auth_group** - User groups
3. **auth_permission** - Permissions
4. **storage_data** - Your uploaded Excel data
5. **django_session** - Login sessions
6. **django_migrations** - Schema version tracking

---

## 🎯 Best Practices

### ✅ DO:
1. **Always use `docker-compose down`** (without -v)
2. **Create regular backups** with pg_dump
3. **Keep DATA.xlsx file** as backup source
4. **Document your admin credentials** securely
5. **Test data persistence** after first setup

### ❌ DON'T:
1. **Never use `docker-compose down -v`** in production
2. **Don't delete postgres_data volume** manually
3. **Don't run `docker system prune`** without checking
4. **Don't forget to backup** before major changes

---

## 🔍 Troubleshooting

### "No data showing in dashboard"

```bash
# Check if data exists
docker-compose exec db psql -U user -d storage_db -c "SELECT COUNT(*) FROM storage_data;"
```

If count is 0: You need to upload Excel data again

### "Can't login with admin/admin123"

```bash
# Reset admin password
./reset_admin.sh
```

### "Database connection error"

```bash
# Check if database container is running
docker-compose ps

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

---

## 📖 Summary

**Your data DOES persist between restarts!**

✅ Admin user stays created  
✅ Uploaded Excel data stays loaded  
✅ All settings stay saved  

**As long as you:**
- Use `docker-compose down` (without `-v`)
- Don't delete the `postgres_data` volume
- Keep the docker-compose.yml configuration

**You only need to:**
1. Create admin user **ONCE**
2. Upload Excel data **ONCE**
3. Then just start/stop normally!

---

**Last Updated:** 2025-11-22  
**Database:** PostgreSQL 13  
**Volume:** postgres_data
