# from django.db import models
# from django.core.validators import RegexValidator
# from django.contrib.auth.hashers import make_password

# class HealthcareUser(models.Model):
#     id = models.AutoField(primary_key=True)  # This will generate 1, 2, 3... automatically
#     first_name = models.CharField(max_length=255)
#     last_name = models.CharField(max_length=255)
#     email = models.EmailField(unique=True)
    
    
    
#     mobile_number = models.CharField(
#         max_length=10,
#         validators=[
#             RegexValidator(
#                 regex=r'^\d{10}$',
#                 message="Mobile number must be exactly 10 digits.",
#                 code="invalid_mobile"
#             )
#         ]
#     )

#     password = models.CharField(max_length=255)
#     role = models.CharField(max_length=10, choices=[("patient", "Patient"), ("doctor", "Doctor")])
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def save(self, *args, **kwargs):
#         self.email = self.email.lower()
#         if not self.password.startswith("pbkdf2_sha256$"):  # Only hash password if not already hashed
#             self.password = make_password(self.password)
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f"{self.first_name} {self.last_name} ({self.email})"

# models.py
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from djongo import models
from django.core.validators import EmailValidator, RegexValidator, MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
import bleach  # Prevents XSS (Sanitizes text input)

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


from djongo import models
from django.utils.timezone import now, timedelta

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



from django.db import models
from django.utils.timezone import now
from django.contrib.auth.models import AbstractBaseUser

class PasswordResetToken(models.Model):
    email = models.EmailField(unique=True)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(default=now)

    def is_expired(self):
        return self.created_at < now() - timedelta(minutes=15)  # Token valid for 15 mins


