# 👥 Creating General Users

## Quick Command

To create a general (non-admin) user, run this command:

```bash
docker-compose exec -T backend python manage.py shell <<EOF
from django.contrib.auth.models import User
User.objects.create_user('USERNAME_HERE', 'email@example.com', 'PASSWORD_HERE')
print("User created!")
EOF
```

**Change these 3 fields:**
- `USERNAME_HERE` - The username for login
- `email@example.com` - User's email address
- `PASSWORD_HERE` - User's password

---

## 📋 Examples

### Create user: john
```bash
docker-compose exec -T backend python manage.py shell <<EOF
from django.contrib.auth.models import User
User.objects.create_user('john', 'john@example.com', 'john123')
print("User created!")
EOF
```

### Create user: jane
```bash
docker-compose exec -T backend python manage.py shell <<EOF
from django.contrib.auth.models import User
User.objects.create_user('jane', 'jane@example.com', 'jane456')
print("User created!")
EOF
```

### Create user: bob
```bash
docker-compose exec -T backend python manage.py shell <<EOF
from django.contrib.auth.models import User
User.objects.create_user('bob', 'bob@example.com', 'bob789')
print("User created!")
EOF
```

---

## 🔐 User Permissions

**General users can:**
- ✅ Login to the dashboard
- ✅ View all data and charts
- ❌ Cannot upload Excel files
- ❌ Cannot access admin panel

**Admin users can:**
- ✅ Login to the dashboard
- ✅ View all data and charts
- ✅ Upload Excel files
- ✅ Access admin panel

---

## 👤 Default Users

### Admin User
- **Username:** admin
- **Password:** admin123
- **Created by:** `./create_admin_auto.sh`

### Test General User
- **Username:** user
- **Password:** user123
- **Created by:** The command above

---

## ✅ Verify User Creation

Check if a user exists:

```bash
docker-compose exec backend python manage.py shell
```

Then:
```python
from django.contrib.auth.models import User
print(User.objects.filter(username='john').count())  # Should print: 1
exit()
```

---

## 🔄 Update User Password

If a user already exists and you want to reset their password:

```bash
docker-compose exec -T backend python manage.py shell <<EOF
from django.contrib.auth.models import User
user = User.objects.get(username='john')
user.set_password('new_password')
user.save()
print("Password updated!")
EOF
```

---

## 🗑️ Delete a User

```bash
docker-compose exec -T backend python manage.py shell <<EOF
from django.contrib.auth.models import User
User.objects.filter(username='john').delete()
print("User deleted!")
EOF
```

---

## 📊 List All Users

```bash
docker-compose exec backend python manage.py shell
```

Then:
```python
from django.contrib.auth.models import User
for user in User.objects.all():
    role = "Admin" if user.is_superuser else "Regular"
    print(f"{user.username} - {user.email} - {role}")
exit()
```

---

## 💡 Tips

1. **Usernames must be unique** - You can't create two users with the same username
2. **Emails should be unique** - Though not enforced, it's best practice
3. **Users persist in database** - They stay created even after container restarts
4. **Safe to run multiple times** - If username exists, you'll get an error (harmless)

---

## 🆘 Troubleshooting

### "User already exists" error
```bash
# Update the password instead
docker-compose exec -T backend python manage.py shell <<EOF
from django.contrib.auth.models import User
user = User.objects.get(username='john')
user.set_password('new_password')
user.save()
print("Password updated!")
EOF
```

### Can't login with created user
1. Verify user exists (see "Verify User Creation" above)
2. Check password is correct
3. Make sure containers are running: `docker-compose ps`
4. Check backend logs: `docker-compose logs backend`

---

**Last Updated:** 2025-11-22  
**Version:** 2.1
