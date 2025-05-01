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
    success_rate = models.FloatField(default=0.0)  # Added success rate field
    
    # Hospital relationship
    hospital = models.ForeignKey(
        Hospital, 
        on_delete=models.CASCADE, 
        related_name='doctors'
    )

    SPECIALIZATION_CONDITIONS = {
        'cardiology': ['heart disease', 'hypertension', 'arrhythmia', 'heart failure'],
        'pulmonology': ['asthma', 'copd', 'bronchitis', 'pneumonia', 'tuberculosis'],
        'neurology': ['migraine', 'epilepsy', 'stroke', 'parkinsons disease'],
        'orthopedics': ['arthritis', 'back pain', 'fracture', 'osteoporosis'],
        'dermatology': ['acne', 'eczema', 'psoriasis', 'skin infection'],
        'gastroenterology': ['ulcer', 'ibs', 'hepatitis', 'gastrointestinal diseases'],
        'endocrinology': ['diabetes', 'thyroid disorders', 'hormonal imbalance'],
        'general': ['fever', 'cold', 'flu', 'general checkup']
    }

    class Meta:
        db_table = 'doctors'
        indexes = [
            models.Index(fields=['specialization']),
            models.Index(fields=['rating']),
            models.Index(fields=['experience_years'])
        ]

    def __str__(self):
        return f"Dr. {self.name} ({self.specialization})"

    def clean_conditions(self):
        """Clean and standardize conditions_treated"""
        if not self.conditions_treated:
            self.conditions_treated = []
            return

        if isinstance(self.conditions_treated, str):
            conditions = [c.strip().lower() for c in self.conditions_treated.split(',')]
        else:
            conditions = [str(c).strip().lower() for c in self.conditions_treated]

        # Remove duplicates while preserving order
        seen = set()
        self.conditions_treated = [x for x in conditions if not (x in seen or seen.add(x))]

    def add_specialization_conditions(self):
        """Add common conditions based on specialization"""
        spec_lower = self.specialization.lower()
        if spec_lower in self.SPECIALIZATION_CONDITIONS:
            base_conditions = set(self.SPECIALIZATION_CONDITIONS[spec_lower])
            current_conditions = set(c.lower() for c in self.conditions_treated)
            self.conditions_treated = list(current_conditions | base_conditions)

    def save(self, *args, **kwargs):
        # Update hospital coordinates if needed
        if self.hospital and (not self.hospital.latitude or not self.hospital.longitude):
            from user_management.utils import get_coordinates_from_address
            lat, lon = get_coordinates_from_address(self.hospital.address)
            if lat and lon:
                self.hospital.latitude = lat
                self.hospital.longitude = lon
                self.hospital.save()

        # Clean and standardize conditions
        self.clean_conditions()
        
        # Add specialization-specific conditions
        self.add_specialization_conditions()

        # Ensure rating is within bounds
        self.rating = max(0.0, min(5.0, self.rating))
        
        super().save(*args, **kwargs)
