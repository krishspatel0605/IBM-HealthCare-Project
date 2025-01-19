from rest_framework import serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)  # Add confirm_password
    mobile_number = serializers.CharField(write_only=True)    # Add mobile_number
    role = serializers.CharField(write_only=True)             # Add role

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password', 'confirm_password', 'mobile_number', 'role']

    def validate(self, attrs):
        # Check if password and confirm_password match
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        # Remove confirm_password from validated_data
        validated_data.pop('confirm_password')
        role = validated_data.pop('role')  # You can handle this separately if needed
        mobile_number = validated_data.pop('mobile_number')  # Handle this as needed

        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        # Optional: Attach mobile_number and role to user (e.g., using a Profile model)
        return user
# can i display mobile number and role in the admin panel as well?