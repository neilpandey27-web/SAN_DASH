# 🔐 Admin Login Help Guide

## Problem: Can't Login to the Dashboard

If you're getting "Invalid Credentials" at http://localhost:3000, it means you need to create or reset your admin user.

---

## 🚀 Quick Fix (Recommended)

### Option 1: Automatic Admin Creation (Fastest!)

Run this single command to automatically create/reset admin user:

```bash
./create_admin_auto.sh
```

**This will:**
- ✅ Check if Docker is running
- ✅ Start containers if needed
- ✅ Create admin user (or reset if exists)
- ✅ Set default credentials

**Default Login Credentials:**
- **Username:** `admin`
- **Password:** `admin123`

---

### Option 2: Interactive Reset

If you want more control:

```bash
./reset_admin.sh
```

**This lets you:**
1. Reset password for existing 'admin' user
2. Create a completely new superuser with custom credentials

---

## 📋 Manual Method (If Scripts Don't Work)

### Create New Admin User

```bash
# Make sure containers are running
docker-compose up -d

# Wait for database to be ready
sleep 10

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

Follow the prompts:
- Username: `admin`
- Email: `admin@example.com`
- Password: (your choice)
- Password (again): (confirm)

### Reset Existing Admin Password

```bash
docker-compose exec backend python manage.py changepassword admin
```

---

## 🔍 Troubleshooting

### "Docker is not running"
- Open Docker Desktop on your Mac
- Wait for it to fully start (whale icon in menu bar)
- Try again

### "Containers are not running"
```bash
docker-compose up -d
sleep 15
./create_admin_auto.sh
```

### "No such service: backend"
```bash
# Rebuild containers
docker-compose down
docker-compose up --build -d
sleep 15
./create_admin_auto.sh
```

### Still Can't Login?

Check if backend is running:
```bash
curl http://localhost:8000/api/
```

Check logs:
```bash
docker-compose logs backend | tail -50
```

---

## 📝 Complete Workflow

1. **Start Application:**
   ```bash
   docker-compose up -d
   ```

2. **Create Admin (Auto):**
   ```bash
   ./create_admin_auto.sh
   ```

3. **Login:**
   - Go to: http://localhost:3000
   - Username: `admin`
   - Password: `admin123`

4. **Upload Data:**
   - Click upload button
   - Select `DATA.xlsx`
   - View your dashboard!

---

## 🛑 Stop Application

```bash
docker-compose down
```

---

## 📚 More Help

- Full setup guide: `SETUP_GUIDE.md`
- Project documentation: `README.md`
- Quick reference: `QUICK_REFERENCE.md`
