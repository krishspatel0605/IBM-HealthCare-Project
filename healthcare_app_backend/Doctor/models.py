from django.db import models
from django.core.validators import RegexValidator
from hospital.models import Hospital

class Doctor(models.Model):
    name = models.CharField(max_length=100)
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
    specialization = models.CharField(max_length=100, default='General')
    experience_years = models.PositiveIntegerField(default=0)
    availability = models.TextField(default="10 AM - 7 PM")
    consultation_fee_inr = models.PositiveIntegerField(default=500)
    patients_treated = models.PositiveIntegerField(default=0)
    rating = models.FloatField(default=4.0)
    conditions_treated = models.JSONField(default=list, blank=True)
    
    # Hospital relationship - allowing multiple doctors per hospital
    hospital = models.ForeignKey(
        Hospital, 
        on_delete=models.CASCADE, 
        related_name='doctors'
    )

    class Meta:
        db_table = 'doctors'

    def __str__(self):
        return f"Dr. {self.name} ({self.specialization})"
