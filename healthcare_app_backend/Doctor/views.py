from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from .models import Doctor
from .serializers import DoctorSerializer, DoctorRegistrationSerializer
from hospital.models import Hospital
from django.db.models import Q, F, ExpressionWrapper, FloatField
import re
from django.shortcuts import render
import logging
from rest_framework.views import APIView

# Import the recommender components
from recommendation_system.doctor_recommender import DoctorRecommender
from recommendation_system.utils import (
    batch_preprocess_doctors,
    save_model,
    load_model,
    get_model_path
)
recommender_available = True

logger = logging.getLogger(__name__)

# Global variable to store the recommender model
recommender = None

@api_view(['GET'])
def recommend_nearest_doctors(request):
    """
    Recommend nearest doctors based on user's latitude and longitude.
    """
    from user_management.models import User

    user_latitude = request.GET.get('user_latitude')
    user_longitude = request.GET.get('user_longitude')
    limit = int(request.GET.get('limit', 10))

    # If latitude or longitude not provided, fetch first user with valid lat/lon
    if user_latitude is None or user_longitude is None:
        return Response(
            {'error': 'User location not provided and no fallback available'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user_latitude = float(user_latitude)
        user_longitude = float(user_longitude)
    except ValueError:
        return Response(
            {'error': 'Invalid latitude or longitude values'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Calculate distance for each doctor using hospital location
    doctors = Doctor.objects.annotate(
        distance=ExpressionWrapper(
            (F('hospital__latitude') - user_latitude) ** 2 +
            (F('hospital__longitude') - user_longitude) ** 2,
            output_field=FloatField()
        )
    ).order_by('distance')[:limit]

    # Serialize and return results
    serializer = DoctorSerializer(doctors, many=True)
    return Response({
        'recommended_doctors': serializer.data
    })

def get_recommender():
    """Get or initialize the recommender model"""
    global recommender
    if recommender is None:
        try:
            recommender = DoctorRecommender()
            recommender.load(get_model_path())
        except Exception as e:
            logger.error(f"Error loading recommender model: {e}")
            recommender_available = False
    return recommender

@api_view(['GET'])
def get_doctors(request):
    """
    Get all doctors or filter by specialization
    """
    specialization = request.GET.get('specialization', '').strip().lower()
    
    # Check cache first
    cache_key = f"doctors_{specialization}" if specialization else "doctors_all"
    cached_data = cache.get(cache_key)

    if cached_data:
        return JsonResponse(cached_data, safe=False)

    # Filter doctors based on specialization query
    if specialization:
        doctors = Doctor.objects.filter(specialization__icontains=specialization)
    else:
        doctors = Doctor.objects.all()

    doctor_list = list(doctors.values(
        "id", "name", "specialization", "experience_years", 
        "availability", "consultation_fee_inr", "rating", "patients_treated"
    ))

    # Store result in cache
    cache.set(cache_key, doctor_list, timeout=300)  # Cache for 5 minutes

    return JsonResponse(doctor_list, safe=False)

@api_view(['GET'])
def get_specialization_options(request):
    """
    Fetches a list of unique specializations offered by doctors.
    """
    cache_key = "specialization_options"
    cached_data = cache.get(cache_key)

    if cached_data:
        return JsonResponse(cached_data, safe=False)

    # Fetch unique specializations
    specializations = Doctor.objects.values_list("specialization", flat=True).distinct()
    unique_specializations = sorted(set(specializations))

    cache.set(cache_key, unique_specializations, timeout=600)  # Cache for 10 minutes
    return JsonResponse(unique_specializations, safe=False)

@api_view(['GET'])
def doctor_details_view(request, id):
    """
    Get detailed information about a specific doctor
    """
    try:
        doctor = Doctor.objects.get(id=id)
        
        doctor_data = {
            "id": doctor.id,
            "name": doctor.name,
            "specialization": doctor.specialization,
            "experience_years": doctor.experience_years,
            "availability": doctor.availability,
            "consultation_fee_inr": doctor.consultation_fee_inr,
            "patients_treated": doctor.patients_treated,
            "rating": doctor.rating,
            "mobile_number": doctor.mobile_number
        }
        
        # Add hospital details if doctor is associated with a hospital
        if doctor.hospital:
            doctor_data["hospital"] = {
                "id": doctor.hospital.id,
                "name": doctor.hospital.name,
                "address": doctor.hospital.address,
                "latitude": str(doctor.hospital.latitude),
                "longitude": str(doctor.hospital.longitude)
            }
        
        return JsonResponse(doctor_data, safe=False)
    
    except Doctor.DoesNotExist:
        return JsonResponse({"error": "Doctor not found"}, status=404)

    except Exception as e:
        print(f"Error: {e}")  # Debugging
        return JsonResponse({"error": "Something went wrong!"}, status=500)

@api_view(['GET'])
def recommend_doctors(request):
    """
    Recommend doctors based on query condition using ML model
    """
    query = request.GET.get('query', '').strip().lower()
    limit = int(request.GET.get('limit', 10))

    if not query:
        return Response(
            {'error': 'Query parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get recommender model
    recommender = get_recommender()
    if not recommender or not recommender_available:
        return Response(
            {'error': 'Recommender system not available'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    try:
        # Get doctors from database
        doctors = Doctor.objects.all()
        doctor_list = list(doctors.values())

        # If no doctors found
        if not doctor_list:
            return Response({'recommended_doctors': []})

        # Preprocess doctors data
        processed_doctors = batch_preprocess_doctors(doctor_list)

        # Get recommendations
        recommended_indices = recommender.recommend_for_condition(
            query, processed_doctors, limit
        )

        # Map indices back to doctor data
        recommended_doctors = [doctor_list[i] for i in recommended_indices]
        
        return Response({
            'recommended_doctors': recommended_doctors
        })

    except Exception as e:
        logger.error(f"Recommendation error: {str(e)}")
        return Response(
            {'error': 'Failed to generate recommendations'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def list_all_doctors(request):
    """List all doctors in the database"""
    try:
        doctors = Doctor.objects.all()
        serializer = DoctorSerializer(doctors, many=True)
        
        return Response({
            'doctors': serializer.data,
            'count': doctors.count()
        })
    except Exception as e:
        logger.error(f"Error listing doctors: {str(e)}")
        return Response(
            {'error': 'An error occurred while retrieving doctors'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'PUT'])
def manage_doctor_profile(request, email=None):
    """
    GET: Retrieves doctor profile by email
    PUT: Updates doctor profile information
    """
    if not email:
        return JsonResponse({"error": "Email is required"}, status=400)
    
    try:
        # Find the doctor by matching the mobile number
        # This assumes doctor's name format is "FirstName LastName" from user model
        from user_management.models import User
        user = User.objects.get(email=email, role='doctor')
        
        # Look for the doctor with the same mobile number
        try:
            doctor = Doctor.objects.get(mobile_number=user.mobile_number)
        except Doctor.DoesNotExist:
            # If doctor doesn't exist but user is a doctor, create doctor profile
            doctor = Doctor.objects.create(
                name=user.name,
                mobile_number=user.mobile_number,
                specialization="General"
            )
        
        if request.method == 'GET':
            # Return doctor profile details
            serializer = DoctorSerializer(doctor)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            serializer = DoctorSerializer(doctor, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                # Clear related cache keys
                cache.delete(f"doctors_all")
                cache.delete(f"doctors_{doctor.specialization.lower()}")
                cache.delete("specialization_options")
                
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except User.DoesNotExist:
        return JsonResponse({"error": "Doctor not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

class DoctorRegistrationView(APIView):
    def post(self, request):
        serializer = DoctorRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                doctor = serializer.save()
                return Response({
                    'message': 'Doctor registered successfully',
                    'doctor_id': doctor.id
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
