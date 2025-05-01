from rest_framework import serializers
from .models import Hospital

class HospitalSerializer(serializers.ModelSerializer):
    doctor_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Hospital
        fields = [
            'id', 'name', 'specialization', 'address',
            'latitude', 'longitude', 'available_beds',
            'diseases_treated', 'doctor_count'
        ]
        
    def get_doctor_count(self, obj):
        """Get count of doctors associated with this hospital"""
        return obj.doctors.count()