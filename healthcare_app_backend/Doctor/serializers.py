from rest_framework import serializers
from .models import Doctor
from hospital.models import Hospital
from django.core.validators import RegexValidator
from user_management.models import Appointment

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ['id', 'name', 'address', 'latitude', 'longitude']

class DoctorSerializer(serializers.ModelSerializer):
    hospital = HospitalSerializer()
    
    class Meta:
        model = Doctor
        fields = ['id', 'name', 'specialization', 'experience_years', 'mobile_number',
                 'availability', 'consultation_fee_inr', 'patients_treated', 'rating',
                 'conditions_treated', 'success_rate', 'hospital']
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure conditions_treated is always a list
        if data['conditions_treated'] is None:
            data['conditions_treated'] = []
        elif isinstance(data['conditions_treated'], str):
            data['conditions_treated'] = [x.strip() for x in data['conditions_treated'].split(',')]
        return data

class DoctorRegistrationSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(required=True)
    address = serializers.CharField(required=True)
    latitude = serializers.FloatField(required=False, default=0.0)
    longitude = serializers.FloatField(required=False, default=0.0)

    class Meta:
        model = Doctor
        fields = '__all__'

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
        fields = ['id', 'doctor', 'doctor_name', 'user', 'user_name', 'appointment_date', 
                'reason', 'created_at', 'hospital_name', 'hospital_address', 'specialization']
        read_only_fields = ['created_at']


