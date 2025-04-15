from django.db import models
from django.core.validators import RegexValidator
from hospital.models import Hospital_Details

class Doctor(models.Model):
    class Meta:
        db_table = 'doctors'

    hospital = models.ForeignKey(
        Hospital_Details, on_delete=models.CASCADE, related_name='doctor_profiles',
        null=True, blank=True
    )
    doctor_name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100)
    experience_years = models.IntegerField(default=0)
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
    availability = models.CharField(max_length=100, default="10 AM - 5 PM")
    consultation_fee_inr = models.IntegerField(default=500)
    patients_treated = models.IntegerField(default=0)
    rating = models.FloatField(default=4.0)
    conditions_treated = models.JSONField(default=list, blank=True, null=True, help_text="List of conditions or diseases the doctor treats")
    available_beds = models.IntegerField(default=0)
    address = models.CharField(max_length=255, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    def __str__(self):
        return self.doctor_name