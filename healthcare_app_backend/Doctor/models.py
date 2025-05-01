from django.db import models
from django.core.validators import RegexValidator
from hospital.models import Hospital

COMMON_CONDITIONS = {
    'pulmonology': ['asthma', 'copd', 'bronchitis', 'pneumonia'],
    'cardiology': ['hypertension', 'heart disease', 'arrhythmia', 'heart failure'],
    'neurology': ['migraine', 'epilepsy', 'stroke', 'multiple sclerosis'],
    'orthopedics': ['arthritis', 'osteoporosis', 'back pain', 'joint pain'],
    'endocrinology': ['diabetes', 'thyroid disorders', 'hormonal imbalance'],
    'psychiatry': ['depression', 'anxiety', 'bipolar disorder', 'schizophrenia'],
    'dermatology': ['acne', 'psoriasis', 'eczema', 'skin cancer'],
    'gastroenterology': ['ibs', 'ulcer', 'crohn disease', 'hepatitis']
}

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

    def save(self, *args, **kwargs):
        # Ensure coordinates are updated when hospital changes
        if self.hospital and (not self.hospital.latitude or not self.hospital.longitude):
            from user_management.utils import get_coordinates_from_address
            lat, lon = get_coordinates_from_address(self.hospital.address)
            if lat and lon:
                self.hospital.latitude = lat
                self.hospital.longitude = lon
                self.hospital.save()

        # Ensure conditions_treated is always a list of lowercase strings
        if self.conditions_treated:
            if isinstance(self.conditions_treated, str):
                self.conditions_treated = [c.strip().lower() for c in self.conditions_treated.split(',')]
            else:
                self.conditions_treated = [str(c).strip().lower() for c in self.conditions_treated]
        else:
            self.conditions_treated = []
            
        # Automatically add common conditions based on specialization
        spec_lower = self.specialization.lower()
        for specialty, conditions in COMMON_CONDITIONS.items():
            if specialty in spec_lower:
                self.conditions_treated = list(set(self.conditions_treated + conditions))
            
        super().save(*args, **kwargs)
