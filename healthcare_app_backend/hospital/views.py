from django.http import JsonResponse
from .models import Hospital
from django.core.cache import cache
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import HospitalSerializer
from Doctor.models import Doctor

def get_hospitals(request):
    disease_query = request.GET.get('disease', '').strip().lower()
    
    # Check cache first
    cache_key = f"hospitals_{disease_query}" if disease_query else "hospitals_all"
    cached_data = cache.get(cache_key)

    if cached_data:
        return JsonResponse(cached_data, safe=False)

    # Filter hospitals based on disease query
    if disease_query:
        hospitals = Hospital.objects.filter(diseases_treated__icontains=disease_query)
    else:
        hospitals = Hospital.objects.all()
    
    hospital_list = list(hospitals.values("name", "specialization", "address", "available_beds"))

    # Store result in cache
    cache.set(cache_key, hospital_list, timeout=300)  # Cache for 5 minutes

    return JsonResponse(hospital_list, safe=False)

def get_disease_options(request):
    """
    Fetches a list of unique diseases treated by hospitals.
    """
    cache_key = "disease_options"
    cached_data = cache.get(cache_key)

    if cached_data:
        return JsonResponse(cached_data, safe=False)

    # Fetch unique diseases
    diseases = Hospital.objects.values_list("diseases_treated", flat=True)
    unique_diseases = sorted(set(disease for disease_list in diseases for disease in disease_list))

    cache.set(cache_key, unique_diseases, timeout=600)  # Cache for 10 minutes
    return JsonResponse(unique_diseases, safe=False)

def Hospital_Details_View(request, id):
    try:
        hospital = Hospital.objects.get(id=id)
        doctors = Doctor.objects.filter(hospital=hospital)

        hospital_data = {
            "id": hospital.id,
            "name": hospital.name,
            "address": hospital.address,
            "available_beds": hospital.available_beds,
            "latitude": str(hospital.latitude),
            "longitude": str(hospital.longitude),
            "doctors": [
                {
                    "name": doctor.name,
                    "specialization": doctor.specialization,
                    "experience": doctor.experience,
                    "availability": doctor.availability if hasattr(doctor, 'availability') else "10 AM - 5 PM",
                    "fee": doctor.consultation_fee_inr if hasattr(doctor, 'consultation_fee_inr') else 500
                }
                for doctor in doctors
            ]
        }
        return JsonResponse(hospital_data, safe=False)
    
    except Hospital.DoesNotExist:
        return JsonResponse({"error": "Hospital not found"}, status=404)

    except Exception as e:
        print(f"Error: {e}")  # Debugging
        return JsonResponse({"error": "Something went wrong!"}, status=500)

