from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.core.validators import EmailValidator, RegexValidator
from django.core.exceptions import ValidationError
import bleach  # Prevents XSS (Sanitizes text input)
from django.conf import settings
from Doctor.models import Doctor
from django.utils.timezone import now, timedelta

# Custom validator for name & address (prevents script injection)
def sanitize_input(value):
    clean_value = bleach.clean(value, strip=True)  # Removes HTML/JS tags
    if value != clean_value:
        raise ValidationError("Invalid input detected. HTML/JavaScript is not allowed.")
    return clean_value

# Custom User Manager
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, role='user', **extra_fields):
        if not email:
            raise ValueError("The Email field is required")
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'doctor')  # Admin role removed
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

# Custom User Model with Input Validation
class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('user', 'user'),   # 'user' is a patient
        ('doctor', 'Doctor'),
    ]

    email = models.EmailField(
        unique=True,
        validators=[EmailValidator(message="Enter a valid email address.")],
    )
    name = models.CharField(
        max_length=100,
        validators=[sanitize_input, RegexValidator(r'^[a-zA-Z\s]+$', "Name must contain only letters and spaces.")]
    )
    mobile_number = models.CharField(
        max_length=10,
        unique=True,
        null=True,
        blank=True,
        validators=[RegexValidator(r'^\d{10}$', "Enter a valid 10-digit mobile number.")]
    )
    date_of_birth= models.DateField(
        null=True,
        blank=True,
        )
    
    address = models.TextField(
        null=True,
        blank=True,
        validators=[sanitize_input]
    )
    is_active = models.BooleanField(default=False)  # Initially inactive until OTP verification
    is_staff = models.BooleanField(default=False)   # Only superusers are staff
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='user'
    )
    email_otp = models.CharField(max_length=6, null=True, blank=True)
    otp_expiry = models.DateTimeField(null=True, blank=True)  # <-- add this in your model if not already

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'mobile_number','date_of_birth', 'address','password','role']  # Add other required fields here

    role = models.CharField(max_length=10, choices=[("user", "Patient"), ("doctor", "Doctor")], default="user")
    
    # Fix conflicts by changing related_name
    groups = models.ManyToManyField(
        "auth.Group",
        related_name="custom_user_groups",  # ✅ Prevents clash with auth.User.groups
        blank=True
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="custom_user_permissions",  # ✅ Prevents clash with auth.User.user_permissions
        blank=True
    )

    def __str__(self):
        return self.email


class ActivationToken(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    token = models.CharField(max_length=100, unique=True)
    user_data = models.JSONField(default=dict)  # ✅ Default empty dict for existing rows
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"{self.email} - {self.otp}"


class UserSearch(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='searches')
    query = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']  # Latest searches first

class SavedDoctor(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='saved_doctors')
    doctor = models.ForeignKey('Doctor.Doctor', on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'doctor']  # A user can save a doctor only once
        ordering = ['-timestamp']  # Latest saved first

class PasswordResetToken(models.Model):
    email = models.EmailField(unique=True)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(default=now)

    def is_expired(self):
        return self.created_at < now() - timedelta(minutes=15)  # Token valid for 15 mins


class Appointment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    appointment_date = models.DateTimeField()
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-appointment_date']

    def __str__(self):
        return f"Appointment of {self.user.email} with Dr. {self.doctor.doctor_name} on {self.appointment_date}"
