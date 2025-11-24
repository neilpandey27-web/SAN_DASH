from django.contrib.auth.models import User

# Create or reset admin user
try:
    admin = User.objects.get(username='admin')
    print("✅ Admin user already exists - resetting password")
    admin.set_password('admin123')
    admin.is_staff = True
    admin.is_superuser = True
    admin.email = 'admin@example.com'
    admin.save()
    print("   Username: admin")
    print("   Password: admin123")
    print("   Role: Superuser (can upload data)")
except User.DoesNotExist:
    admin = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("✅ Admin user created")
    print("   Username: admin")
    print("   Password: admin123")
    print("   Role: Superuser (can upload data)")

print("")

# Create or reset general user
try:
    user = User.objects.get(username='viewer')
    print("✅ Viewer user already exists - resetting password")
    user.set_password('viewer123')
    user.is_staff = False
    user.is_superuser = False
    user.email = 'viewer@example.com'
    user.save()
    print("   Username: viewer")
    print("   Password: viewer123")
    print("   Role: Regular user (view only)")
except User.DoesNotExist:
    user = User.objects.create_user('viewer', 'viewer@example.com', 'viewer123')
    print("✅ Viewer user created")
    print("   Username: viewer")
    print("   Password: viewer123")
    print("   Role: Regular user (view only)")

print("")
print("=" * 50)
print("✅ User creation complete!")
