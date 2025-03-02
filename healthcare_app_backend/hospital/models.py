from django.db import models

# Create your models here.
class Hospital(models.Model):
    name = models.CharField(max_length=200)
    specialization = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    available_beds = models.IntegerField()
    diseases_treated = models.JSONField(default=list)  # Store related diseases as a list

    def __str__(self):
        return F"{self.name} "
    
    
from django.db import models
from django.db import models
from django.core.validators import RegexValidator

# Create your models here.
class Hospital_Details(models.Model):
    name = models.CharField(max_length=200)
    specialization = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    available_beds = models.IntegerField()
    diseases_treated = models.JSONField(default=list)  # Store related diseases as a list

    def __str__(self):
        return  F"{self.name} "
    

class Doctor(models.Model):
    hospital = models.ForeignKey(Hospital_Details, on_delete=models.CASCADE, related_name='doctors', null=True, blank=True)
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
