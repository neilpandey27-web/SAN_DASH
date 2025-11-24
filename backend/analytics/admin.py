from django.contrib import admin
from .models import StorageData

@admin.register(StorageData)
class StorageDataAdmin(admin.ModelAdmin):
    list_display = ['volume', 'pool', 'child_pool', 'volume_size_gb', 'utilized_gb', 'left_gb']
    list_filter = ['pool', 'child_pool']
    search_fields = ['volume', 'pool', 'child_pool']
    ordering = ['-volume_size_gb']
