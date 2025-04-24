from django.core.management.base import BaseCommand
from hospital.models import Hospital
from Doctor.models import Doctor
import random
from django.db import transaction

class Command(BaseCommand):
    help = 'Populates the database with dummy data'

    def handle(self, *args, **kwargs):
        # Sample data
        specializations = [
            'Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician',
            'Orthopedic', 'Gynecologist', 'Psychiatrist', 'Ophthalmologist',
            'ENT Specialist', 'General Physician'
        ]

        hospitals = [
            {
                'name': 'City General Hospital',
                'specialization': 'Multi-Specialty',
                'address': '123 Main St, Mumbai, Maharashtra',
                'latitude': 19.0760,
                'longitude': 72.8777,
                'available_beds': 200,
                'diseases_treated': ['Heart Disease', 'Diabetes', 'Cancer', 'Respiratory Diseases']
            },
            {
                'name': 'Apollo Hospitals',
                'specialization': 'Multi-Specialty',
                'address': '456 Health Ave, Delhi, India',
                'latitude': 28.6139,
                'longitude': 77.2090,
                'available_beds': 300,
                'diseases_treated': ['Cardiac Care', 'Neurology', 'Orthopedics']
            },
            {
                'name': 'Fortis Healthcare',
                'specialization': 'Multi-Specialty',
                'address': '789 Medical Blvd, Bangalore, India',
                'latitude': 12.9716,
                'longitude': 77.5946,
                'available_beds': 250,
                'diseases_treated': ['Cancer Care', 'Kidney Treatment', 'Brain & Spine']
            }
        ]

        # Create hospitals
        created_hospitals = []
        for hospital_data in hospitals:
            hospital, created = Hospital.objects.get_or_create(
                name=hospital_data['name'],
                defaults=hospital_data
            )
            created_hospitals.append(hospital)
            if created:
                self.stdout.write(f'Created hospital: {hospital.name}')

        # Create doctors
        doctor_names = [
            'Dr. Rajesh Kumar', 'Dr. Priya Sharma', 'Dr. Amit Patel',
            'Dr. Neha Singh', 'Dr. Sanjay Gupta', 'Dr. Meera Reddy',
            'Dr. Arun Verma', 'Dr. Anjali Desai', 'Dr. Vikram Malhotra',
            'Dr. Deepa Nair', 'Dr. Suresh Mehta', 'Dr. Kavita Shah'
        ]

        for name in doctor_names:
            # Generate random doctor data
            doctor_data = {
                'name': name,
                'specialization': random.choice(specializations),
                'experience_years': random.randint(5, 30),
                'mobile_number': f'98{random.randint(10000000, 99999999)}',
                'availability': random.choice(['Morning', 'Evening', 'Both']),
                'consultation_fee_inr': random.choice([500, 800, 1000, 1500, 2000]),
                'patients_treated': random.randint(1000, 5000),
                'rating': round(random.uniform(3.5, 5.0), 1),
                'hospital': random.choice(created_hospitals)
            }

            doctor, created = Doctor.objects.get_or_create(
                name=doctor_data['name'],
                defaults=doctor_data
            )
            if created:
                self.stdout.write(f'Created doctor: {doctor.name}')

def populate_dummy_data():
    """Populate the database with dummy doctors and hospitals"""
    
    # Sample data for hospitals
    hospitals = [
        {
            'name': 'City General Hospital',
            'specialization': 'Multi-Specialty',
            'address': '123 Healthcare Avenue, Downtown',
            'available_beds': 200,
            'latitude': 40.7128,
            'longitude': -74.0060
        },
        {
            'name': 'Community Medical Center',
            'specialization': 'Primary Care',
            'address': '456 Wellness Street, Midtown',
            'available_beds': 150,
            'latitude': 40.7589,
            'longitude': -73.9851
        }
    ]
    
    # Sample data for doctors
    doctors = [
        {
            'name': 'Dr. Sarah Johnson',
            'specialization': 'Pulmonology',
            'experience_years': 15,
            'availability': 'Mon-Fri, 9AM-5PM',
            'consultation_fee_inr': 1500,
            'rating': 4.8,
            'patients_treated': 5000,
            'mobile_number': '1234567890',
            'conditions_treated': 'Asthma,Bronchitis,COPD,Sleep Apnea',
            'hospital_index': 0
        },
        {
            'name': 'Dr. Michael Chen',
            'specialization': 'Cardiology',
            'experience_years': 12,
            'availability': 'Mon-Sat, 10AM-6PM',
            'consultation_fee_inr': 2000,
            'rating': 4.7,
            'patients_treated': 4500,
            'mobile_number': '2345678901',
            'conditions_treated': 'Heart Disease,Hypertension,Arrhythmia',
            'hospital_index': 0
        },
        {
            'name': 'Dr. Emily Brown',
            'specialization': 'Endocrinology',
            'experience_years': 10,
            'availability': 'Tue-Sat, 9AM-5PM',
            'consultation_fee_inr': 1800,
            'rating': 4.9,
            'patients_treated': 3800,
            'mobile_number': '3456789012',
            'conditions_treated': 'Diabetes,Thyroid Disorders,Hormonal Imbalance',
            'hospital_index': 1
        },
        {
            'name': 'Dr. James Wilson',
            'specialization': 'Rheumatology',
            'experience_years': 14,
            'availability': 'Mon-Fri, 8AM-4PM',
            'consultation_fee_inr': 1700,
            'rating': 4.6,
            'patients_treated': 4200,
            'mobile_number': '4567890123',
            'conditions_treated': 'Arthritis,Lupus,Fibromyalgia',
            'hospital_index': 1
        }
    ]
    
    try:
        with transaction.atomic():
            # Create hospitals
            created_hospitals = []
            for hospital_data in hospitals:
                hospital = Hospital.objects.create(**hospital_data)
                created_hospitals.append(hospital)
            
            # Create doctors with hospital associations
            for doctor_data in doctors:
                hospital_index = doctor_data.pop('hospital_index')
                doctor_data['hospital'] = created_hospitals[hospital_index]
                Doctor.objects.create(**doctor_data)
                
        print("Successfully populated dummy data!")
        return True
        
    except Exception as e:
        print(f"Error populating dummy data: {str(e)}")
        return False

if __name__ == "__main__":
    populate_dummy_data()