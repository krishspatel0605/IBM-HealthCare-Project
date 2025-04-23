from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from .models import Doctor
from .serializers import DoctorSerializer
from hospital.models import Hospital_Details
from django.db.models import Q, F, ExpressionWrapper, FloatField
import re
from django.shortcuts import render
import logging

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
        # Removed fallback to User model filtering by latitude and longitude as these fields do not exist on User
        # Instead, return error if location not provided
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
    
    try:
        recommender = get_recommender()
        if recommender is None:
            return Response(
                {'error': 'Recommendation system not available'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        nearest_doctors = recommender.recommend_nearest_doctors(
            user_latitude=user_latitude,
            user_longitude=user_longitude,
            limit=limit
        )
        
        return Response({
            'nearest_doctors': nearest_doctors,
            'user_latitude': user_latitude,
            'user_longitude': user_longitude,
            'results_count': len(nearest_doctors)
        })
    except Exception as e:
        logger.error(f"Error in nearest doctor recommendation: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An error occurred while fetching nearest doctors'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def get_recommender():
    """Get or initialize the recommender model"""
    global recommender
    
    # If recommendation system is not available, return None
    if not recommender_available:
        logger.warning("Recommendation system is not available due to import errors")
        return None
    
    if recommender is None:
        # Try to load existing model
        try:
            model_path = get_model_path()
            loaded_recommender = load_model(model_path)
            
            if loaded_recommender:
                recommender = loaded_recommender
            else:
                # Create new model with default parameters
                recommender = DoctorRecommender(n_estimators=100)
            
            try:
                # Get all doctors from database
                doctors = Doctor.objects.all()
                doctors_data = DoctorSerializer(doctors, many=True).data
                
                # Preprocess and fit model
                processed_data = batch_preprocess_doctors(doctors_data)
                recommender.fit(processed_data)
                
                # Save the model
                save_model(recommender, model_path)
                
            except Exception as e:
                logger.error(f"Error training recommender: {str(e)}")
                recommender = None
        except Exception as e:
            logger.error(f"Error initializing recommender: {str(e)}")
            recommender = None
    
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
        "id", "doctor_name", "specialization", "experience_years", 
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
            "doctor_name": doctor.doctor_name,
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
                "location": doctor.hospital.location
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
    specialization = request.GET.get('specialization', None)
    user_latitude = request.GET.get('user_latitude')
    user_longitude = request.GET.get('user_longitude')
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))

    if not query:
        return Response(
            {'error': 'Please provide a search query'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # First get matching doctors from Doctor model
        doctors = Doctor.objects.filter(
            Q(doctor_name__icontains=query) |
            Q(specialization__icontains=query) |
            Q(conditions_treated__contains=query)
        )

        # Combine and deduplicate results
        combined_doctors = []
        seen_mobile_numbers = set()

        # Add doctors from Doctor model
        for doctor in doctors:
            if doctor.mobile_number not in seen_mobile_numbers:
                seen_mobile_numbers.add(doctor.mobile_number)
                doctor_data = {
                    'id': doctor.id,
                    'name': doctor.doctor_name,
                    'specialization': doctor.specialization,
                    'experience': doctor.experience_years,
                    'mobile_number': doctor.mobile_number,
                    'rating': doctor.rating,
                    'availability': doctor.availability,
                    'fee': doctor.consultation_fee_inr,
                    'conditions_treated': doctor.conditions_treated,
                    'treats_searched_condition': any(query in condition.lower() for condition in (doctor.conditions_treated or []))
                }
                combined_doctors.append(doctor_data)

        results = {
            'recommended_doctors': combined_doctors,
            'query': query,
            'results_count': len(combined_doctors),
            'using_ml_recommendations': False,
            'total_pages': (len(combined_doctors) + limit - 1) // limit
        }

        return Response(results)

    except Exception as e:
        logger.error(f"Error in doctor recommendation: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An error occurred while fetching recommendations'},
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
                name=f"{user.first_name} {user.last_name}",
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
