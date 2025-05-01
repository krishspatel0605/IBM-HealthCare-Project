from django.http import JsonResponse
from .models import Hospital
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .serializers import HospitalSerializer
from Doctor.models import Doctor
from models.hospital_recommender import HospitalRecommender
import logging

logger = logging.getLogger(__name__)

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
                    "experience_years": doctor.experience_years if hasattr(doctor, 'experience_years') else 0,
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
        logger.error(f"Error in Hospital_Details_View: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_hospital_recommendations(request):
    """
    Get hospital recommendations based on user location
    Required query parameters:
    - lat: user's latitude
    - lon: user's longitude
    Optional query parameters:
    - radius_km: search radius in kilometers (default: 10)
    - min_beds: minimum number of available beds (default: 1)
    """
    try:
        # Get parameters from request
        lat = request.GET.get('lat')
        lon = request.GET.get('lon')
        radius_km = float(request.GET.get('radius_km', 10))
        min_beds = int(request.GET.get('min_beds', 1))

        if not all([lat, lon]):
            return Response(
                {"error": "Latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Initialize recommender
        recommender = HospitalRecommender()
        
        # Get recommendations
        recommendations = recommender.get_recommendations(
            float(lat),
            float(lon),
            radius_km=radius_km,
            min_beds=min_beds
        )

        # Format response
        response_data = [{
            "id": hospital.id,
            "name": hospital.name,
            "address": hospital.address,
            "available_beds": hospital.available_beds,
            "distance_score": round(score * 100, 2),
            "latitude": str(hospital.latitude),
            "longitude": str(hospital.longitude),
            "specialization": hospital.specialization,
            "doctors_count": hospital.doctors.count()
        } for hospital, score in recommendations]

        return Response(response_data)

    except (ValueError, TypeError) as e:
        return Response(
            {"error": f"Invalid parameters: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error in hospital recommendations: {str(e)}")
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

