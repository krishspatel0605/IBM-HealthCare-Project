from rest_framework import serializers
from .models import Doctor
from hospital.models import Hospital
from django.core.validators import RegexValidator
from user_management.models import Appointment

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = Appointment
        fields = ['id', 'doctor', 'doctor_name', 'user', 'user_name', 'appointment_date', 'reason', 'created_at']
        read_only_fields = ['created_at']

class DoctorRegistrationSerializer(serializers.Serializer):
    # Personal Information
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    mobile_number = serializers.CharField(
        max_length=10,
        validators=[
            RegexValidator(
                regex=r'^\d{10}$',
                message="Mobile number must be exactly 10 digits."
            )
        ]
    )
    
    # Hospital Information
    hospital_name = serializers.CharField(max_length=200)
    address = serializers.CharField(max_length=500)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    
    # Professional Information
    specialization = serializers.CharField(max_length=100)
    experience_years = serializers.IntegerField()
    availability = serializers.CharField(max_length=100)
    consultation_fee_inr = serializers.IntegerField()
    
    # Authentication
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        # First create or get the hospital
        hospital_data = {
            'name': validated_data['hospital_name'],
            'address': validated_data['address'],
            'latitude': validated_data['latitude'],
            'longitude': validated_data['longitude'],
            'available_beds': 0  # Default value
        }
        hospital, _ = Hospital.objects.get_or_create(
            name=hospital_data['name'],
            defaults=hospital_data
        )

        # Create the doctor
        doctor_data = {
            'name': f"{validated_data['first_name']} {validated_data['last_name']}",
            'specialization': validated_data['specialization'],
            'experience_years': validated_data['experience_years'],
            'mobile_number': validated_data['mobile_number'],
            'availability': validated_data['availability'],
            'consultation_fee_inr': validated_data['consultation_fee_inr'],
            'hospital': hospital,
            'patients_treated': 0,
            'rating': 0.0
        }
        
        doctor = Doctor.objects.create(**doctor_data)
        return doctor