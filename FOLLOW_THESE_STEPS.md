# 📋 Follow These Steps on Your Mac

## ✅ What I've Done in the Sandbox

I've cloned your repository and added three new helper files:
1. ✅ `create_admin_auto.sh` - Automatic admin creation
2. ✅ `reset_admin.sh` - Interactive password reset
3. ✅ `ADMIN_LOGIN_HELP.md` - Complete troubleshooting guide
4. ✅ Pushed everything to GitHub

---

## 🚀 What You Need to Do on Your Mac

### Step 1: Pull the Latest Changes

Open Terminal on your Mac and run:

```bash
# Navigate to your project folder
cd /path/to/your/SAN_Storage_Dashboard

# Pull the new scripts from GitHub
git pull origin main
```

---

### Step 2: Run the Auto-Create Script (Easiest!)

```bash
# Make sure you're in the project directory
cd /path/to/your/SAN_Storage_Dashboard

# Run the automatic admin creator
./create_admin_auto.sh
```

**This will automatically:**
- ✅ Check if Docker is running
- ✅ Start your containers if needed
- ✅ Create admin user (or reset password if it exists)
- ✅ Set credentials to: `admin` / `admin123`

---

### Step 3: Login to Your Dashboard

1. **Open browser:** http://localhost:3000
2. **Login with:**
   - Username: `admin`
   - Password: `admin123`
3. **Success!** 🎉

---

## 🔄 Alternative Methods

### Method 1: Interactive Reset

If you want to choose your own password:

```bash
./reset_admin.sh
```

Then select option 1 or 2 and follow the prompts.

---

### Method 2: Manual Commands

If scripts don't work:

```bash
# Start containers
docker-compose up -d

# Wait a moment
sleep 10

# Create new admin
docker-compose exec backend python manage.py createsuperuser
```

---

## 📝 Quick Reference

**Start Application:**
```bash
docker-compose up -d
```

**Create/Reset Admin:**
```bash
./create_admin_auto.sh
```

**Stop Application:**
```bash
docker-compose down
```

**View Logs:**
```bash
docker-compose logs -f backend
```

---

## ❓ Need More Help?

Read the complete guide: `ADMIN_LOGIN_HELP.md`

---

## 🎯 Summary

1. `git pull origin main` (get the new scripts)
2. `./create_admin_auto.sh` (create admin user)
3. Go to http://localhost:3000
4. Login with `admin` / `admin123`
5. Done! 🚀
