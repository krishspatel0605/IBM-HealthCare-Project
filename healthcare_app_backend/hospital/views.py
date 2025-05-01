from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache

from .models import Hospital
from .serializers import HospitalSerializer
from Doctor.models import Doctor

from recommendation_system.location_recommender import LocationBasedHospitalRecommender

import logging
import pandas as pd

logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_hospitals(request):
    """Get all hospitals or filter by specialization"""
    try:
        # Check cache first
        cache_key = "all_hospitals"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return JsonResponse(cached_data, safe=False)
            
        hospitals = Hospital.objects.all().select_related('doctors')
        serializer = HospitalSerializer(hospitals, many=True)
        
        # Cache the response for 5 minutes
        cache.set(cache_key, serializer.data, timeout=300)
        
        return JsonResponse(serializer.data, safe=False)
        
    except Exception as e:
        logger.error(f"Error fetching hospitals: {str(e)}")
        return JsonResponse(
            {"error": "Failed to fetch hospitals"}, 
            status=500
        )

@api_view(['GET'])
def get_nearest_hospitals(request):
    """Get hospitals near a given location"""
    try:
        user_latitude = float(request.GET.get('latitude', 0))
        user_longitude = float(request.GET.get('longitude', 0))
        max_distance = float(request.GET.get('max_distance_km', 20))
        
        # Initialize location-based recommender
        recommender = LocationBasedHospitalRecommender()
        
        # Get all hospitals
        hospitals = Hospital.objects.all().select_related('doctors')
        
        # Convert to list of dictionaries for the recommender
        hospital_data = []
        for hospital in hospitals:
            data = {
                'id': hospital.id,
                'name': hospital.name,
                'address': hospital.address,
                'specialization': hospital.specialization,
                'latitude': float(hospital.latitude),
                'longitude': float(hospital.longitude),
                'available_beds': hospital.available_beds,
                'diseases_treated': hospital.diseases_treated,
                'doctors': [
                    {
                        'name': doc.name,
                        'specialization': doc.specialization
                    }
                    for doc in hospital.doctors.all()
                ]
            }
            hospital_data.append(data)
        
        # Get recommendations
        recommendations = recommender.recommend_hospitals(
            user_latitude=user_latitude,
            user_longitude=user_longitude,
            max_distance_km=max_distance
        )
        
        return JsonResponse({
            'hospitals': recommendations,
            'count': len(recommendations)
        })
        
    except ValueError as e:
        return JsonResponse(
            {"error": "Invalid coordinate values"}, 
            status=400
        )
    except Exception as e:
        logger.error(f"Error finding nearest hospitals: {str(e)}")
        return JsonResponse(
            {"error": "Failed to find nearest hospitals"}, 
            status=500
        )

@api_view(['GET'])
def get_disease_options(request):
    """Fetches a list of unique diseases treated by hospitals"""
    try:
        # Check cache first
        cache_key = "disease_options"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return JsonResponse(cached_data, safe=False)
        
        # Get all diseases from all hospitals
        all_diseases = set()
        hospitals = Hospital.objects.all()
        
        for hospital in hospitals:
            if hospital.diseases_treated:
                if isinstance(hospital.diseases_treated, list):
                    all_diseases.update(hospital.diseases_treated)
                else:
                    all_diseases.add(hospital.diseases_treated)
        
        diseases_list = sorted(list(all_diseases))
        
        # Cache for 10 minutes
        cache.set(cache_key, diseases_list, timeout=600)
        
        return JsonResponse(diseases_list, safe=False)
        
    except Exception as e:
        logger.error(f"Error fetching disease options: {str(e)}")
        return JsonResponse(
            {"error": "Failed to fetch disease options"}, 
            status=500
        )

@api_view(['GET'])
def Hospital_Details_View(request, id):
    """Get detailed information about a specific hospital"""
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
                    "experience_years": doctor.experience_years,
                    "availability": doctor.availability,
                    "fee": doctor.consultation_fee_inr
                }
                for doctor in doctors
            ]
        }
        return JsonResponse(hospital_data, safe=False)
    
    except Hospital.DoesNotExist:
        return JsonResponse({"error": "Hospital not found"}, status=404)

    except Exception as e:
        logger.error(f"Error fetching hospital details: {str(e)}")
        return JsonResponse({"error": "Failed to fetch hospital details"}, status=500)

