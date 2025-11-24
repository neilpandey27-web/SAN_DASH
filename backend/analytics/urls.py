from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('check-auth/', views.check_auth, name='check_auth'),
    path('import/', views.upload_data, name='upload_data'),
    path('dashboard/', views.get_dashboard_data, name='get_dashboard_data'),
]
