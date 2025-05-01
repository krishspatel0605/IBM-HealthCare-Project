from rest_framework import serializers
from django.core.validators import RegexValidator
from hospital.models import Hospital
from user_management.models import Appointment
from .models import Doctor

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ['id', 'name', 'address', 'latitude', 'longitude', 'available_beds', 'specialization']

class DoctorSerializer(serializers.ModelSerializer):
    hospital = HospitalSerializer(read_only=True)
    
    class Meta:
        model = Doctor
        fields = '__all__'

class DoctorRegistrationSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(required=True)
    address = serializers.CharField(required=True)
    latitude = serializers.FloatField(required=False, default=0.0)
    longitude = serializers.FloatField(required=False, default=0.0)

    class Meta:
        model = Doctor
        fields = '__all__'
        extra_kwargs = {
            'mobile_number': {
                'required': True,
                'validators': [
                    RegexValidator(
                        regex=r'^\d{10}$',
                        message="Mobile number must be exactly 10 digits."
                    )
                ]
            },
            'name': {'required': True},
            'specialization': {'required': False},
            'experience_years': {'required': False},
            'availability': {'required': False},
            'consultation_fee_inr': {'required': False},
            'conditions_treated': {'required': False}
        }

    def create(self, validated_data):
        # Extract hospital data
        hospital_name = validated_data.pop('hospital_name')
        address = validated_data.pop('address')
        latitude = validated_data.pop('latitude', 0.0)
        longitude = validated_data.pop('longitude', 0.0)

        # Set default values for optional fields
        validated_data.setdefault('specialization', 'General')
        validated_data.setdefault('experience_years', 0)
        validated_data.setdefault('availability', '10 AM - 7 PM')
        validated_data.setdefault('consultation_fee_inr', 500)
        validated_data.setdefault('conditions_treated', [])

        try:
            # Try to get existing hospital first
            hospital = Hospital.objects.get(
                name=hospital_name,
                address=address
            )
        except Hospital.DoesNotExist:
            # Create new hospital if it doesn't exist
            hospital = Hospital.objects.create(
                name=hospital_name,
                address=address,
                latitude=latitude,
                longitude=longitude,
                specialization=validated_data.get('specialization', 'General'),
                available_beds=0,
                diseases_treated=validated_data.get('conditions_treated', [])
            )

        # Create doctor with the hospital
        validated_data['hospital'] = hospital
        return Doctor.objects.create(**validated_data)

class AppointmentSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    hospital_name = serializers.CharField(source='doctor.hospital.name', read_only=True)
    hospital_address = serializers.CharField(source='doctor.hospital.address', read_only=True)
    specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'doctor', 'doctor_name', 'user', 'user_name', 
            'appointment_date', 'reason', 'created_at',
            'hospital_name', 'hospital_address', 'specialization'
        ]
        read_only_fields = ['created_at']


