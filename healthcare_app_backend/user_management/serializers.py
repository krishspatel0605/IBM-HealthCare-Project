from rest_framework import serializers
from .models import HealthcareUser
from django.contrib.auth.hashers import make_password

class HealthcareUserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True, error_messages={
        "required": "Confirm password is required."
    })
    
    class Meta:
        model = HealthcareUser
        fields = ['id','first_name', 'last_name', 'email', 'mobile_number', 'role', 'password', 'confirm_password']
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
        """ Ensure password and confirm_password match. """
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        """ Remove confirm_password and hash password before saving the user. """
        validated_data.pop('confirm_password', None)
        validated_data['password'] = make_password(validated_data['password'])  # Hash the password
        return HealthcareUser.objects.create(**validated_data)


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import HealthcareUser

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = HealthcareUser.email  # Ensure email is used

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom data to token if needed
        token['email'] = user.email
        token['role'] = user.role
        return token
