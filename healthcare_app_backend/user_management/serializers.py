from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import make_password
from .models import User, Appointment

class HealthcareUserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(
        write_only=True, 
        required=True, 
        error_messages={
            "required": "Confirm password is required."
        }
    )
    
    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'mobile_number', 'role', 
            'address', 'password', 'confirm_password',
            'date_of_birth', 'latitude', 'longitude'
        ]
        extra_kwargs = {
            'name': {
                'required': True,
                'error_messages': {'required': 'Name is required.'}
            },
            'email': {
                'required': True, 
                'error_messages': {
                    'required': 'Email is required.',
                    'invalid': 'Enter a valid email address.'
                }
            },
            'mobile_number': {
                'required': True, 
                'error_messages': {'required': 'Mobile number is required.'}
            },
            'password': {
                'write_only': True,
                'required': True,
                'min_length': 8,
                'error_messages': {
                    'required': 'Password is required.',
                    'min_length': 'Password must be at least 8 characters long.'
                }
            },
            'latitude': {'required': False},
            'longitude': {'required': False},
            'date_of_birth': {'required': False},
            'role': {'required': False}
        }

    def validate_email(self, value):
        """Ensure the email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_mobile_number(self, value):
        """Ensure the mobile number contains only digits and is of valid length."""
        if not value.isdigit():
            raise serializers.ValidationError("Mobile number should contain only digits.")
        if len(value) != 10:
            raise serializers.ValidationError("Mobile number must be exactly 10 digits long.")
        return value

    def validate(self, data):
        """Ensure password and confirm_password match."""
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        """Remove confirm_password and hash password before saving the user."""
        validated_data.pop('confirm_password', None)
        validated_data['password'] = make_password(validated_data['password'])
        return User.objects.create(**validated_data)

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'doctor', 'doctor_name', 'user', 'user_name',
            'appointment_date', 'reason', 'created_at'
        ]
        read_only_fields = ['created_at']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['role'] = user.role
        token['name'] = user.name
        token['email'] = user.email
        return token
