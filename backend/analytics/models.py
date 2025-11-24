from django.db import models


class StorageData(models.Model):
    volume = models.CharField(max_length=255)
    pool = models.CharField(max_length=255)
    child_pool = models.CharField(max_length=255)
    volume_size_gb = models.FloatField()
    utilized_gb = models.FloatField()
    left_gb = models.FloatField()

    class Meta:
        db_table = 'storage_data'
        indexes = [
            models.Index(fields=['pool']),
            models.Index(fields=['pool', 'child_pool']),
            models.Index(fields=['volume']),
        ]

    def __str__(self):
        return f"{self.volume} - {self.pool}/{self.child_pool}"
