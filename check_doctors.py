import os
import sys
from pathlib import Path

# Set up Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'IBM-HealthCare-Project.healthcare_app_backend.healthcare_app_backend.settings')

import django
django.setup()

from Doctor.models import Doctor
from Doctor.serializers import DoctorSerializer

def main():
    doctors = Doctor.objects.all()
    print(f"Total doctors in database: {len(doctors)}")
    
    if doctors.exists():
        print("\nSample doctor data:")
        for i, doctor in enumerate(doctors[:3]):
            print(f"\nDoctor {i+1}:")
            serializer = DoctorSerializer(doctor)
            for key, value in serializer.data.items():
                print(f"{key}: {value}")

if __name__ == "__main__":
    main()
