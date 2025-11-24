from rest_framework import serializers
from .models import Tenant, Volume

class VolumeSerializer(serializers.ModelSerializer):
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = Volume
        fields = '__all__'

class TenantSerializer(serializers.ModelSerializer):
    volume_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = '__all__'
    
    def get_volume_count(self, obj):
        return obj.volumes.count()

class TenantDetailSerializer(serializers.ModelSerializer):
    volumes = VolumeSerializer(many=True, read_only=True)
    volume_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = '__all__'
    
    def get_volume_count(self, obj):
        return obj.volumes.count()
