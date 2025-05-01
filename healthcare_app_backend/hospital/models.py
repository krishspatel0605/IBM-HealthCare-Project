from django.db import models
from user_management.utils import get_coordinates_from_address

class Hospital(models.Model):
    name = models.CharField(max_length=200)
    specialization = models.CharField(max_length=200)
    address = models.CharField(max_length=500)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    available_beds = models.IntegerField()
    diseases_treated = models.JSONField(default=list)  # Store related diseases as a list

    class Meta:
        indexes = [
            models.Index(fields=['name']),  # Add index on name for faster lookups
        ]

    def save(self, *args, **kwargs):
        # Update coordinates if address has changed
        if self.address:
            lat, lon = get_coordinates_from_address(self.address)
            if lat and lon:
                self.latitude = lat
                self.longitude = lon
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.address})"


