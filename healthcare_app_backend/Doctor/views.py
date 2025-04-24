from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from .models import Doctor
from .serializers import DoctorSerializer, DoctorRegistrationSerializer, AppointmentSerializer
from hospital.models import Hospital
from django.db.models import Q, F, ExpressionWrapper, FloatField
import re
from django.shortcuts import render
import logging
from rest_framework.views import APIView
from user_management.models import Appointment, User
from user_management.permissions import IsUser  # Added this import
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

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

from recommendation_system.utils import load_model, get_model_path

def get_recommender():
    """Get or initialize the recommender model"""
    global recommender
    if recommender is None:
        try:
            loaded_model = load_model(get_model_path())
            if loaded_model is None:
                recommender = DoctorRecommender()
            else:
                recommender = loaded_model
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

    try:
        # Get doctors from database
        doctors = Doctor.objects.all()
        doctor_list = list(doctors.values())

        # If no doctors found, return dummy data
        if not doctor_list:
            # Dummy data for testing
            dummy_doctors = [
                {
                    'id': 1,
                    'name': 'Dr. Sarah Johnson',
                    'specialization': 'Pulmonology',
                    'experience_years': 15,
                    'availability': 'Mon-Fri, 9AM-5PM',
                    'consultation_fee_inr': 1500,
                    'rating': 4.8,
                    'patients_treated': 5000,
                    'mobile_number': '1234567890',
                    'conditions_treated': 'Asthma,Bronchitis,COPD,Sleep Apnea',
                },
                {
                    'id': 2,
                    'name': 'Dr. Michael Chen',
                    'specialization': 'Cardiology',
                    'experience_years': 12,
                    'availability': 'Mon-Sat, 10AM-6PM',
                    'consultation_fee_inr': 2000,
                    'rating': 4.7,
                    'patients_treated': 4500,
                    'mobile_number': '2345678901',
                    'conditions_treated': 'Heart Disease,Hypertension,Arrhythmia',
                }
            ]
            # Filter dummy data based on query
            filtered_doctors = [
                doc for doc in dummy_doctors 
                if query in doc['specialization'].lower() 
                or query in doc['conditions_treated'].lower()
            ]
            return Response({'recommended_doctors': filtered_doctors})

        # If doctors exist, use the recommender system
        processed_doctors = batch_preprocess_doctors(doctor_list)
        
        # Get recommendations
        recommender = get_recommender()
        if not recommender or not recommender_available:
            # Fallback to simple text matching if recommender is not available
            filtered_doctors = [
                doc for doc in doctor_list 
                if query in doc['specialization'].lower() 
                or (doc.get('conditions_treated', '') and query in doc['conditions_treated'].lower())
            ]
            return Response({'recommended_doctors': filtered_doctors[:limit]})

        recommended_doctors = recommender.recommend_doctors(
            query=query,
            limit=limit,
            page=1,
            user_latitude=float(request.GET.get('user_latitude')) if request.GET.get('user_latitude') else None,
            user_longitude=float(request.GET.get('user_longitude')) if request.GET.get('user_longitude') else None
        )
        
        return Response({
            'recommended_doctors': recommended_doctors
        })

    except Exception as e:
        logger.error(f"Recommendation error: {str(e)}")
        # Return dummy data in case of any error
        dummy_doctors = [
            {
                'id': 1,
                'name': 'Dr. Sarah Johnson',
                'specialization': 'Pulmonology',
                'experience_years': 15,
                'availability': 'Mon-Fri, 9AM-5PM',
                'consultation_fee_inr': 1500,
                'rating': 4.8,
                'patients_treated': 5000,
                'mobile_number': '1234567890',
                'conditions_treated': 'Asthma,Bronchitis,COPD,Sleep Apnea',
            }
        ]
        return Response({'recommended_doctors': dummy_doctors})

@api_view(['GET'])
@cache_page(60 * 5)  # Cache for 5 minutes
def list_all_doctors(request):
    """List all doctors in the database"""
    try:
        # Try to get from cache first
        cache_key = 'all_doctors_list'
        cached_doctors = cache.get(cache_key)
        
        if cached_doctors:
            return Response(cached_doctors)

        doctors = Doctor.objects.all()
        doctor_count = doctors.count()

        # If no doctors found, return dummy data
        if doctor_count == 0:
            dummy_doctors = [
                {
                    'id': 1,
                    'name': 'Dr. Sarah Johnson',
                    'specialization': 'Pulmonology',
                    'experience_years': 15,
                    'availability': 'Mon-Fri, 9AM-5PM',
                    'consultation_fee_inr': 1500,
                    'rating': 4.8,
                    'patients_treated': 5000,
                    'mobile_number': '1234567890',
                    'conditions_treated': 'Asthma,Bronchitis,COPD,Sleep Apnea',
                },
                {
                    'id': 2,
                    'name': 'Dr. Michael Chen',
                    'specialization': 'Cardiology',
                    'experience_years': 12,
                    'availability': 'Mon-Sat, 10AM-6PM',
                    'consultation_fee_inr': 2000,
                    'rating': 4.7,
                    'patients_treated': 4500,
                    'mobile_number': '2345678901',
                    'conditions_treated': 'Heart Disease,Hypertension,Arrhythmia',
                }
            ]
            return Response({
                'doctors': dummy_doctors,
                'count': len(dummy_doctors)
            })

        serializer = DoctorSerializer(doctors, many=True)
        response_data = {
            'doctors': serializer.data,
            'count': doctor_count
        }
        
        # Cache the response
        cache.set(cache_key, response_data, timeout=60 * 5)  # Cache for 5 minutes
        
        return Response(response_data)
    except Exception as e:
        logger.error(f"Error listing doctors: {str(e)}")
        # Return dummy data in case of error
        dummy_doctors = [
            {
                'id': 1,
                'name': 'Dr. Sarah Johnson',
                'specialization': 'Pulmonology',
                'experience_years': 15,
                'availability': 'Mon-Fri, 9AM-5PM',
                'consultation_fee_inr': 1500,
                'rating': 4.8,
                'patients_treated': 5000,
                'mobile_number': '1234567890',
                'conditions_treated': 'Asthma,Bronchitis,COPD,Sleep Apnea',
            }
        ]
        return Response({
            'doctors': dummy_doctors,
            'count': len(dummy_doctors)
        })

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

from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def book_appointment(request):
    """
    Book an appointment with a doctor
    """
    try:
        doctor_id = request.data.get('doctor_id')
        appointment_date = request.data.get('appointment_date')
        reason = request.data.get('reason', '')
        
        # Debugging logs
        import traceback
        print("book_appointment called with data:", request.data)
        
        # Validate input
        if not doctor_id or not appointment_date:
            print("Validation failed: Missing doctor_id or appointment_date")
            return Response({
                'error': 'Doctor ID and appointment date are required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Get the doctor
        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            print("Doctor not found for id:", doctor_id)
            return Response({
                'error': 'Doctor not found'
            }, status=status.HTTP_404_NOT_FOUND)
            
        # Check for appointment conflicts
        try:
            appointment_datetime = datetime.fromisoformat(appointment_date.replace('Z', '+00:00'))
        except ValueError:
            print("Invalid appointment date format:", appointment_date)
            return Response({
                'error': 'Invalid appointment date format. Use ISO 8601 format.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        time_buffer = timedelta(minutes=30)
        
        # Adjust conflict check to exclude the current appointment if updating
        conflicting_appointments = Appointment.objects.filter(
            doctor=doctor,
            appointment_date__range=[
                appointment_datetime - time_buffer,
                appointment_datetime + time_buffer
            ]
        ).exists()
        
        # If conflict exists, check if it's the same appointment (for update scenarios)
        if conflicting_appointments:
            # Instead of blocking, allow if the conflict is with the same appointment (optional)
            # Here, assuming this is a new booking, so block
            print("Conflicting appointment exists for doctor id:", doctor_id)
            return Response({
                'error': 'Doctor already has an appointment scheduled during this time'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use authenticated user only
        user = request.user
        
        # Check if user is authenticated and active
        if not user or not user.is_authenticated or not user.is_active:
            print("User not authenticated or inactive:", user)
            return Response({
                'error': 'User must be logged in and active to book an appointment'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Create appointment
        appointment = Appointment.objects.create(
            doctor=doctor,
            user=user,
            appointment_date=appointment_date,
            reason=reason
        )
        
        serializer = AppointmentSerializer(appointment)
        print("Appointment created successfully:", serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print("Exception in book_appointment:", str(e))
        traceback.print_exc()
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def doctor_appointments(request):
    """
    Get all appointments for the logged-in doctor
    """
    try:
        # Log the user info for debugging
        logger.debug(f"doctor_appointments called by user: {request.user}, authenticated: {request.user.is_authenticated}")
        
        # Get the doctor associated with the logged-in user
        doctor = Doctor.objects.get(mobile_number=request.user.mobile_number)
        logger.debug(f"Found doctor: {doctor.name} with mobile_number: {doctor.mobile_number}")
        
        # Get all appointments for this doctor
        appointments = Appointment.objects.filter(doctor=doctor).order_by('appointment_date')
        
        # Serialize and return appointments
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)
        
    except Doctor.DoesNotExist:
        logger.error(f"Doctor not found for user: {request.user}")
        return Response({
            'error': 'Doctor not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error in doctor_appointments: {str(e)}")
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

class UserAppointmentsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsUser]
    
    @method_decorator(cache_page(60))  # Cache for 1 minute
    def get(self, request):
        try:
            user = request.user
            # Generate a cache key unique to this user
            cache_key = f'user_appointments_{user.id}'
            cached_appointments = cache.get(cache_key)
            
            if cached_appointments:
                return Response(cached_appointments)
                
            appointments = Appointment.objects.filter(user=user).select_related('doctor').order_by('-appointment_date')
            serializer = AppointmentSerializer(appointments, many=True)
            
            # Cache the response
            cache.set(cache_key, serializer.data, timeout=60)  # Cache for 1 minute
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to fetch user appointments: {str(e)}")
            return Response({"error": "Failed to fetch user appointments"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    def post(self, request):
        # After successful appointment creation, invalidate the cache
        cache.delete(f'user_appointments_{request.user.id}')
        cache.delete('all_doctors_list')  # Also invalidate the doctors list cache as availability might have changed

@api_view(['GET'])
def user_appointments(request):
    """
    Get all appointments for the logged-in user
    """
    try:
        # Get appointments for the logged-in user
        appointments = Appointment.objects.filter(user=request.user).order_by('appointment_date')
        
        # Serialize and return appointments
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def check_appointment_conflict(request):
    """
    Check if a doctor has any conflicting appointments for a given time
    """
    try:
        doctor_id = request.query_params.get('doctor_id')
        appointment_date = request.query_params.get('appointment_date')
        
        if not doctor_id or not appointment_date:
            return Response({
                'error': 'Doctor ID and appointment date are required'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Get the doctor
        doctor = Doctor.objects.get(id=doctor_id)
        
        # Check for appointments within 30 minutes of the requested time
        appointment_datetime = datetime.fromisoformat(appointment_date.replace('Z', '+00:00'))
        time_buffer = timedelta(minutes=30)
        
        conflicting_appointments = Appointment.objects.filter(
            doctor=doctor,
            appointment_date__range=[
                appointment_datetime - time_buffer,
                appointment_datetime + time_buffer
            ]
        ).exists()
        
        return Response({
            'has_conflict': conflicting_appointments
        })
        
    except Doctor.DoesNotExist:
        return Response({
            'error': 'Doctor not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
