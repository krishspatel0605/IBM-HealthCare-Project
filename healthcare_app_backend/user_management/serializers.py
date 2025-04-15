from rest_framework import serializers
from .models import HealthcareUser
from django.contrib.auth.hashers import make_password

class HealthcareUserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True, error_messages={
        "required": "Confirm password is required."
    })
    # Additional fields for doctors - these will be used only when role='doctor'
    specialization = serializers.CharField(write_only=True, required=False)
    experience = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = HealthcareUser
        fields = [
            'id', 'first_name', 'last_name', 'email', 'mobile_number', 'role', 
            'address', 'latitude', 'longitude',
            'password', 'confirm_password', 'specialization', 'experience'
        ]
        extra_kwargs = {
            'first_name': {'required': True, 'error_messages': {'required': 'First name is required.'}},
            'last_name': {'required': True, 'error_messages': {'required': 'Last name is required.'}},
            'email': {
                'required': True, 
                'error_messages': {'required': 'Email is required.', 'invalid': 'Enter a valid email address.'}
            },
            'mobile_number': {
                'required': True, 
                'error_messages': {'required': 'Mobile number is required.'}
            },
            'password': {
                'required': True,
                'min_length': 8,
                'error_messages': {
                    'required': 'Password is required.',
                    'min_length': 'Password must be at least 8 characters long.'
                }
            }
        }

    def validate_email(self, value):
        """ Ensure the email is unique. """
        if HealthcareUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_mobile_number(self, value):
        """ Ensure the mobile number contains only digits and is of valid length. """
        if not value.isdigit():
            raise serializers.ValidationError("Mobile number should contain only digits.")
        if len(value) != 10:
            raise serializers.ValidationError("Mobile number must be exactly 10 digits long.")
        return value

    def validate(self, data):
        """ Ensure password and confirm_password match and validate doctor-specific fields """
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
            
        # If registering as a doctor, validate doctor-specific fields
        if data.get('role') == 'doctor':
            # Make specialization required if role is doctor
            if 'specialization' not in data or not data.get('specialization'):
                data['specialization'] = 'General'  # Default value
                
            # Set default experience if not provided
            if 'experience' not in data:
                data['experience'] = 0
            
        return data

    def create(self, validated_data):
        """ Remove confirm_password and hash password before saving the user. """
        # Remove non-model fields before creating the user
        validated_data.pop('confirm_password', None)
        
        # Remove doctor-specific fields which aren't part of the HealthcareUser model
        specialization = validated_data.pop('specialization', None) 
        experience = validated_data.pop('experience', None)
        
        # Hash the password
        validated_data['password'] = make_password(validated_data['password'])
        
        # Create and return the user
        return HealthcareUser.objects.create(**validated_data)


