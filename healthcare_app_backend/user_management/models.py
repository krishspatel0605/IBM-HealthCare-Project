from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.hashers import make_password
from Doctor.models import Doctor  # Import the Doctor model

class HealthcareUser(models.Model):
    id = models.AutoField(primary_key=True)  # This will generate 1, 2, 3... automatically
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    
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

    password = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=[("patient", "Patient"), ("doctor", "Doctor")])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.email = self.email.lower()
        if not self.password.startswith("pbkdf2_sha256$"):  # Only hash password if not already hashed
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

# User Search history model
class UserSearch(models.Model):
    user = models.ForeignKey(HealthcareUser, on_delete=models.CASCADE, related_name='searches')
    query = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']  # Latest searches first

# User Saved Doctor model
class SavedDoctor(models.Model):
    user = models.ForeignKey(HealthcareUser, on_delete=models.CASCADE, related_name='saved_doctors')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'doctor']  # A user can save a doctor only once
        ordering = ['-timestamp']  # Latest saved first
