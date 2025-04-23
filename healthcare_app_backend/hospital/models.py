from django.db import models
from django.core.validators import RegexValidator
from user_management.utils import get_coordinates_from_address

class Hospital(models.Model):
    name = models.CharField(max_length=200)
    specialization = models.CharField(max_length=200)
    address = models.CharField(max_length=500)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    available_beds = models.IntegerField()
    diseases_treated = models.JSONField(default=list)  # Store related diseases as a list

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
    
class Doctor(models.Model):
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='hospital_doctors', null=True, blank=True)
    name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100)
    experience = models.IntegerField(default=0)  # Fixed the spelling from "experice" to "experience"
    mobile_number = models.CharField(
        max_length=10,
        validators=[
            RegexValidator(
                regex=r'^\d{10}$',
                message="Mobile number must be exactly 10 digits.",
                code="invalid_mobile"
            )
        ]
    )

    def __str__(self):
        return self.name


