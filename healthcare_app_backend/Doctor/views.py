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

<<<<<<< HEAD
# Import the recommender components
from recommendation_system.doctor_recommender import DoctorRecommender
from recommendation_system.utils import (
    batch_preprocess_doctors,
    save_model,
    load_model,
    get_model_path
)
recommender_available = True
=======
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
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543

logger = logging.getLogger(__name__)

# Global variable to store the recommender model
recommender = None

<<<<<<< HEAD
@api_view(['GET'])
def recommend_nearest_doctors(request):
    """
    Recommend nearest doctors based on user's latitude and longitude.
    """
    from user_management.models import HealthcareUser

    user_latitude = request.GET.get('user_latitude')
    user_longitude = request.GET.get('user_longitude')
    limit = int(request.GET.get('limit', 10))

    # If latitude or longitude not provided, fetch first user with valid lat/lon
    if user_latitude is None or user_longitude is None:
        first_user = HealthcareUser.objects.filter(latitude__isnull=False, longitude__isnull=False).order_by('id').first()
        if first_user:
            user_latitude = first_user.latitude
            user_longitude = first_user.longitude
        else:
            return Response(
                {'error': 'User location not provided and no user with valid location found'},
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

=======
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
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
<<<<<<< HEAD
            loaded_recommender = load_model(model_path)
            
            if loaded_recommender:
                recommender = loaded_recommender
            else:
                # Create new model with default parameters
                recommender = DoctorRecommender(n_estimators=100)
=======
            # Try to load existing model, but don't use it if it has the old n_neighbors value
            loaded_recommender = load_model(model_path)
            
            # Create a new model with larger n_neighbors value
            recommender = DoctorRecommender(n_neighbors=50)
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
            
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
<<<<<<< HEAD
        "availability", "fee", "rating", "patients_treated"
=======
        "availability", "fee", "rating"
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
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
<<<<<<< HEAD
    Recommend doctors based on query condition using ML model
    """
    from user_management.models import HealthcareUser

    query = request.GET.get('query', '').strip()
    specialization = request.GET.get('specialization', None)
    limit = int(request.GET.get('limit', 6))  # Default to 6 as per user request
    page = int(request.GET.get('page', 1))  # Default to page 1
    user_latitude = request.GET.get('user_latitude', None)
    user_longitude = request.GET.get('user_longitude', None)

    # Parse optional weight parameters for tuning
    def parse_weight(param_name):
        try:
            val = float(request.GET.get(param_name, None))
            if 0 <= val <= 1:
                return val
        except (TypeError, ValueError):
            pass
        return None

    weights = {
        'similarity': parse_weight('similarity_weight'),
        'specialization': parse_weight('specialization_weight'),
        'experience': parse_weight('experience_weight'),
        'rating': parse_weight('rating_weight'),
        'patients_treated': parse_weight('patients_treated_weight'),
        'fee': parse_weight('fee_weight')
    }
    # Remove None values to use defaults in recommender
    weights = {k: v for k, v in weights.items() if v is not None}
=======
    Recommend doctors based on query condition using KNN model
    """
    query = request.GET.get('query', '').strip()
    sort_by = request.GET.get('sort_by', 'similarity')  # Default to similarity-based sorting
    limit = int(request.GET.get('limit', 20))  # Default to 20, allow overriding
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
    
    if not query:
        return Response(
            {'error': 'Please provide a search query'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
<<<<<<< HEAD
    # If latitude or longitude not provided, fetch first user with valid lat/lon
    if user_latitude is None or user_longitude is None:
        first_user = HealthcareUser.objects.filter(latitude__isnull=False, longitude__isnull=False).order_by('id').first()
        if first_user:
            user_latitude = first_user.latitude
            user_longitude = first_user.longitude
    
    # Convert latitude and longitude to float if provided
    if user_latitude is not None and user_longitude is not None:
        try:
            user_latitude = float(user_latitude)
            user_longitude = float(user_longitude)
        except ValueError:
            return Response(
                {'error': 'Invalid latitude or longitude values'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Get or initialize recommender
    recommender = get_recommender()
    
    if recommender is None:
        logger.warning("Recommendation system not available")
        return Response(
            {'error': 'Recommendation system not available'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        # Get recommendations with optional weights and pagination
        recommendations = recommender.recommend_doctors(
            query=query,
            specialization=specialization,
            user_latitude=user_latitude,
            user_longitude=user_longitude,
            min_score=0.1,
            limit=limit,
            page=page,
            weights=weights if weights else None
        )
    except Exception as e:
        logger.error(f"Error in doctor recommendation: {str(e)}", exc_info=True)
        return Response(
            {'error': 'An error occurred while fetching recommendations'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    if not recommendations:
        return Response({
            'recommended_doctors': [],
            'query': query,
            'specialization': specialization,
            'results_count': 0,
            'using_ml_recommendations': True,
            'message': 'No recommendations found for the given query'
        })
    
    # Map keys to expected frontend keys
    mapped_recommendations = []
    for doc in recommendations:
        mapped_doc = doc.copy()
        if 'doctor_name' in mapped_doc:
            mapped_doc['name'] = mapped_doc.pop('doctor_name')
        if 'experience_years' in mapped_doc:
            mapped_doc['experience'] = mapped_doc.pop('experience_years')
        if 'consultation_fee_inr' in mapped_doc:
            mapped_doc['fee'] = mapped_doc.pop('consultation_fee_inr')
        if 'address' in mapped_doc:
            mapped_doc['location'] = mapped_doc.pop('address')
        mapped_recommendations.append(mapped_doc)
    
    return Response({
        'recommended_doctors': mapped_recommendations,
        'query': query,
        'specialization': specialization,
        'results_count': len(mapped_recommendations),
        'using_ml_recommendations': True
    })
=======
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
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543

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
<<<<<<< HEAD
            # Remove matched_conditions and treats_searched_condition to focus on doctor names
            # Conditions and matched_conditions are omitted
=======
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
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
            
            serialized_doctors.append(doctor_data)
        
        # Sort based on criteria
        if sort_by.lower() == 'rating':
            serialized_doctors.sort(key=lambda x: (-x.get('rating', 0), -x.get('experience', 0)))
<<<<<<< HEAD
        elif sort_by.lower() == 'patients_treated':
            serialized_doctors.sort(key=lambda x: (x.get('patients_treated', float('inf'))))
=======
        elif sort_by.lower() == 'fee':
            serialized_doctors.sort(key=lambda x: (x.get('fee', float('inf'))))
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
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