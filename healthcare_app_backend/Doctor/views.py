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

# Wrap the import in a try-except block to handle potential import errors
try:
    from recommendation_system.doctor_recommender import DoctorRecommender
    from recommendation_system.utils import (
        batch_preprocess_doctors,
        save_model,
        load_model,
        get_model_path
    )
    recommender_available = True
except ImportError as e:
    import warnings
    warnings.warn(f"Error importing recommendation system: {str(e)}")
    recommender_available = False

logger = logging.getLogger(__name__)

# Global variable to store the recommender model
recommender = None

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
            # Try to load existing model, but don't use it if it has the old n_neighbors value
            loaded_recommender = load_model(model_path)
            
            # Create a new model with larger n_neighbors value
            recommender = DoctorRecommender(n_neighbors=50)
            
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
        "id", "name", "specialization", "experience", 
        "availability", "fee", "rating"
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
            "experience": doctor.experience,
            "availability": doctor.availability,
            "fee": doctor.fee,
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
    Recommend doctors based on query condition using KNN model
    """
    query = request.GET.get('query', '').strip()
    sort_by = request.GET.get('sort_by', 'similarity')  # Default to similarity-based sorting
    limit = int(request.GET.get('limit', 20))  # Default to 20, allow overriding
    
    if not query:
        return Response(
            {'error': 'Please provide a search query'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Get or initialize recommender
        recommender = get_recommender()
        
        if recommender is None:
            # Fallback to simple search if recommender is not available
            logger.warning("Recommendation system not available, using simple search")
            return simple_doctor_search(request)
        
        # Get recommendations with sorting
        recommendations = recommender.recommend_doctors(
            query=query,
            sort_by=sort_by,
            min_score=0.1,
            limit=limit  # Use the provided limit parameter
        )
        
        if not recommendations:
            # Fallback to simple search if no recommendations
            return simple_doctor_search(request)
        
        return Response({
            'recommended_doctors': recommendations,
            'query': query,
            'sort_by': sort_by,
            'results_count': len(recommendations),
            'using_ml_recommendations': True
        })
        
    except Exception as e:
        logger.error(f"Error in doctor recommendation: {str(e)}")
        # Fallback to simple search on error
        return simple_doctor_search(request)

def simple_doctor_search(request):
    """
    Simple search fallback when ML recommendations fail
    """
    query = request.GET.get('query', '').strip().lower()
    sort_by = request.GET.get('sort_by', 'experience')  # Default to experience-based sorting
    limit = int(request.GET.get('limit', 20))  # Default to 20, allow overriding
    
    try:
        # Search in name, specialization, and conditions
        doctors = Doctor.objects.filter(
            Q(name__icontains=query) |
            Q(specialization__icontains=query) |
            Q(conditions_treated__icontains=query)
        )
        
        if not doctors.exists():
            return Response({
                'recommended_doctors': [],
                'query': query,
                'sort_by': sort_by,
                'results_count': 0,
                'message': f'No doctors found for "{query}"'
            })
        
        # Serialize doctors
        serialized_doctors = []
        for doctor in doctors:
            doctor_data = DoctorSerializer(doctor).data
            conditions = doctor_data.get('conditions_treated', [])
            
            # Ensure conditions is a list
            if isinstance(conditions, str):
                conditions = [c.strip() for c in conditions.split(',')]
            
            # Find matched conditions
            matched_conditions = [
                cond for cond in conditions
                if query in cond.lower()
            ]
            
            doctor_data['matched_conditions'] = matched_conditions
            doctor_data['treats_searched_condition'] = bool(matched_conditions)
            
            serialized_doctors.append(doctor_data)
        
        # Sort based on criteria
        if sort_by.lower() == 'rating':
            serialized_doctors.sort(key=lambda x: (-x.get('rating', 0), -x.get('experience', 0)))
        elif sort_by.lower() == 'fee':
            serialized_doctors.sort(key=lambda x: (x.get('fee', float('inf'))))
        else:  # Default to experience
            serialized_doctors.sort(key=lambda x: (-x.get('experience', 0), -x.get('rating', 0)))
        
        return Response({
            'recommended_doctors': serialized_doctors,
            'query': query,
            'sort_by': sort_by,
            'results_count': len(serialized_doctors),
            'using_ml_recommendations': False
        })
        
    except Exception as e:
        logger.error(f"Error in simple doctor search: {str(e)}")
        return Response(
            {'error': 'An error occurred while searching for doctors'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def list_all_doctors(request):
    """List all doctors in the database"""
    try:
        # Get the limit parameter, with a default of 0 (no limit)
        limit = int(request.GET.get('limit', 0))
        
        doctors = Doctor.objects.all()
        
        # Apply limit if specified and greater than 0
        if limit > 0:
            doctors = doctors[:limit]
            
        serializer = DoctorSerializer(doctors, many=True)
        return Response({
            'doctors': serializer.data,
            'count': len(doctors)
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
        from user_management.models import HealthcareUser
        user = HealthcareUser.objects.get(email=email, role='doctor')
        
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
        
    except HealthcareUser.DoesNotExist:
        return JsonResponse({"error": "Doctor not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500) 