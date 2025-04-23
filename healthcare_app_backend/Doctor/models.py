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
    specialization = models.CharField(max_length=100, null=True, blank=True)
    experience_years = models.PositiveIntegerField(default=0, null=True, blank=True)
    availability = models.TextField(null=True, blank=True)
    patients_treated = models.PositiveIntegerField(default=0, null=True, blank=True)
    consultation_fee_inr = models.IntegerField()
    rating = models.FloatField(default=4.0)
    conditions_treated = models.JSONField(default=list, blank=True, null=True)
    
    # Hospital relationship
    hospital = models.ForeignKey(
        Hospital, 
        on_delete=models.CASCADE, 
        related_name='doctors'
    )

    class Meta:
        db_table = 'doctors'

    def __str__(self):
        return f"Dr. {self.name}"
