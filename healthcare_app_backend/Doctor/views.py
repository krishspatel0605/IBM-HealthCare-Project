from django.http import JsonResponse
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from .models import Doctor
from .serializers import DoctorSerializer, DoctorRegistrationSerializer, AppointmentSerializer
from hospital.models import Hospital
from django.db.models import Q
import logging
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from user_management.models import Appointment, User
from user_management.permissions import IsUser
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from models.doctor_recommender import DoctorRecommender

logger = logging.getLogger(__name__)

# Initialize the recommender as a singleton
doctor_recommender = DoctorRecommender()

@api_view(['GET'])
def get_doctors(request):
    """
    Get all doctors or filter by specialization/disease
    """
    query = request.GET.get('disease', '').lower().strip()
    doctors = Doctor.objects.select_related('hospital').all()
    
    if query:
        doctors = doctors.filter(
            Q(specialization__icontains=query) |
            Q(conditions_treated__icontains=query)
        )
    
    serializer = DoctorSerializer(doctors, many=True)
    return Response({
        'doctors': serializer.data,
        'count': len(serializer.data)
    })

@api_view(['GET'])
def list_all_doctors(request):
    """
    Get all doctors with optional limit parameter
    """
    try:
        limit = int(request.GET.get('limit', 100))
        doctors = Doctor.objects.select_related('hospital').all()[:limit]
        serializer = DoctorSerializer(doctors, many=True)
        return Response({
            'doctors': serializer.data,
            'count': len(serializer.data)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_specialization_options(request):
    """
    Fetches a list of unique specializations offered by doctors.
    """
    specializations = Doctor.objects.values_list('specialization', flat=True).distinct()
    return Response(list(specializations))

@api_view(['GET'])
def doctor_details_view(request, id):
    """
    Get detailed information about a specific doctor
    """
    try:
        doctor = Doctor.objects.select_related('hospital').get(id=id)
        serializer = DoctorSerializer(doctor)
        return Response(serializer.data)
    except Doctor.DoesNotExist:
        return Response(
            {'error': 'Doctor not found'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET', 'PUT'])
def manage_doctor_profile(request, email=None):
    """
    Get or update doctor profile
    """
    try:
        doctor = Doctor.objects.get(mobile_number=request.user.mobile_number)
        
        if request.method == 'PUT':
            data = request.data
            doctor.name = data.get('name', doctor.name)
            doctor.specialization = data.get('specialization', doctor.specialization)
            doctor.experience_years = data.get('experience_years', doctor.experience_years)
            doctor.availability = data.get('availability', doctor.availability)
            doctor.consultation_fee_inr = data.get('consultation_fee_inr', doctor.consultation_fee_inr)
            doctor.conditions_treated = data.get('conditions_treated', doctor.conditions_treated)
            doctor.save()
        
        serializer = DoctorSerializer(doctor)
        return Response(serializer.data)
    except Doctor.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

class DoctorRegistrationView(APIView):
    """
    Register a new doctor with hospital details
    """
    def post(self, request):
        try:
            serializer = DoctorRegistrationSerializer(data=request.data)
            if serializer.is_valid():
                hospital_data = request.data.get('hospital', {})
                hospital, _ = Hospital.objects.get_or_create(
                    name=hospital_data.get('name'),
                    defaults={
                        'address': hospital_data.get('address', ''),
                        'specialization': request.data.get('specialization', 'General'),
                        'available_beds': hospital_data.get('available_beds', 0)
                    }
                )
                
                doctor = serializer.save(hospital=hospital)
                return Response(DoctorSerializer(doctor).data, status=201)
            return Response(serializer.errors, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

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

        if not doctor_id or not appointment_date:
            return Response({
                'error': 'Doctor ID and appointment date are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        doctor = get_object_or_404(Doctor, id=doctor_id)
        user = request.user

        # Convert string to datetime
        appointment_datetime = datetime.fromisoformat(appointment_date.replace('Z', '+00:00'))

        # Check for conflicts
        if Appointment.objects.filter(
            doctor=doctor,
            appointment_date__range=[
                appointment_datetime - timedelta(minutes=30),
                appointment_datetime + timedelta(minutes=30)
            ]
        ).exists():
            return Response({
                'error': 'This time slot is already booked'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create appointment
        appointment = Appointment.objects.create(
            user=user,
            doctor=doctor,
            appointment_date=appointment_datetime,
            reason=reason
        )

        return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)

    except Doctor.DoesNotExist:
        return Response({
            'error': 'Doctor not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def doctor_appointments(request):
    """
    Get all appointments for the logged-in doctor
    """
    try:
        user = request.user
        
        if user.role != 'doctor':
            return Response({
                'error': 'Only doctors can access this endpoint'
            }, status=status.HTTP_403_FORBIDDEN)

        try:
            doctor = Doctor.objects.filter(
                Q(mobile_number=user.mobile_number) | Q(name=user.name)
            ).first()
            
            if not doctor:
                return Response({
                    'error': 'Doctor profile not found. Please complete your doctor profile first.'
                }, status=status.HTTP_404_NOT_FOUND)

            appointments = Appointment.objects.filter(
                doctor=doctor
            ).select_related('user').order_by('-appointment_date')

            now = timezone.now()
            appointment_data = []

            for appointment in appointments:
                is_upcoming = appointment.appointment_date > now
                data = {
                    'id': appointment.id,
                    'appointment_date': appointment.appointment_date,
                    'reason': appointment.reason,
                    'created_at': appointment.created_at,
                    'user_name': appointment.user.name,
                    'user_email': appointment.user.email,
                    'user_mobile': appointment.user.mobile_number,
                    'status': 'Upcoming' if is_upcoming else 'Past'
                }
                appointment_data.append(data)

            return Response(appointment_data)

        except Exception as e:
            return Response({
                'error': f'Failed to fetch appointments: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    except Exception as e:
        return Response({
            'error': 'An error occurred while fetching appointments'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserAppointmentsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsUser]

    def get(self, request):
        try:
            appointments = Appointment.objects.filter(
                user=request.user
            ).select_related('doctor').order_by('-appointment_date')

            now = timezone.now()
            appointment_data = []

            for appointment in appointments:
                is_upcoming = appointment.appointment_date > now
                doctor = appointment.doctor
                data = {
                    'id': appointment.id,
                    'appointment_date': appointment.appointment_date,
                    'reason': appointment.reason,
                    'created_at': appointment.created_at,
                    'doctor_name': doctor.name,
                    'doctor_specialization': doctor.specialization,
                    'doctor_mobile': doctor.mobile_number,
                    'status': 'Upcoming' if is_upcoming else 'Past',
                    'hospital_name': doctor.hospital.name if doctor.hospital else None,
                    'hospital_address': doctor.hospital.address if doctor.hospital else None
                }
                appointment_data.append(data)

            return Response(appointment_data)

        except Exception as e:
            return Response({
                'error': f'Failed to fetch appointments: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            
        doctor = Doctor.objects.get(id=doctor_id)
        
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

@api_view(['GET'])
def get_doctor_recommendations(request):
    """
    Get personalized doctor recommendations based on disease and location
    
    Query Parameters:
    - disease: The disease/condition to find doctors for
    - lat: User's latitude (optional)
    - lon: User's longitude (optional)
    - radius_km: Search radius in kilometers (optional, default: 10)
    - limit: Maximum number of recommendations (default: 10)
    """
    try:
        # Get parameters
        disease = request.GET.get('disease')
        lat = request.GET.get('lat')
        lon = request.GET.get('lon')
        radius_km = float(request.GET.get('radius_km', 10))
        limit = int(request.GET.get('limit', 10))
        
        # Get recommendations
        recommendations = doctor_recommender.get_recommendations(
            query_disease=disease,
            user_lat=float(lat) if lat else None,
            user_lon=float(lon) if lon else None,
            radius_km=radius_km,
            limit=limit
        )
        
        # Format response with distance information
        response_data = []
        for doctor, score in recommendations:
            doctor_data = {
                'id': doctor.id,
                'name': doctor.name,
                'specialization': doctor.specialization,
                'experience_years': doctor.experience_years,
                'rating': doctor.rating,
                'patients_treated': doctor.patients_treated,
                'consultation_fee_inr': doctor.consultation_fee_inr,
                'availability': doctor.availability,
                'success_rate': doctor.success_rate,
                'conditions_treated': doctor.conditions_treated,
                'match_score': round(score * 100, 2),
                'hospital': None
            }
            
            if doctor.hospital:
                distance_km = None
                if lat and lon:
                    from math import radians, sin, cos, sqrt, atan2
                    R = 6371  # Earth's radius in km
                    lat1, lon1 = radians(float(lat)), radians(float(lon))
                    lat2, lon2 = radians(float(doctor.hospital.latitude)), radians(float(doctor.hospital.longitude))
                    dlat = lat2 - lat1
                    dlon = lon2 - lon1
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    c = 2 * atan2(sqrt(a), sqrt(1-a))
                    distance_km = R * c
                
                doctor_data['hospital'] = {
                    'name': doctor.hospital.name,
                    'address': doctor.hospital.address,
                    'latitude': str(doctor.hospital.latitude),
                    'longitude': str(doctor.hospital.longitude),
                    'distance_km': round(distance_km, 1) if distance_km else None,
                    'facilities': doctor.hospital.facilities,
                    'emergency_available': doctor.hospital.emergency_available,
                    'available_beds': doctor.hospital.available_beds
                }
            
            response_data.append(doctor_data)
        
        return Response({
            'recommendations': response_data,
            'model_info': {
                'feature_importance': {
                    'experience': round(doctor_recommender.feature_importance[0] * 100, 2),
                    'rating': round(doctor_recommender.feature_importance[1] * 100, 2),
                    'patients_treated': round(doctor_recommender.feature_importance[2] * 100, 2),
                    'consultation_fee': round(doctor_recommender.feature_importance[3] * 100, 2),
                    'success_rate': round(doctor_recommender.feature_importance[4] * 100, 2)
                } if doctor_recommender.feature_importance is not None else None
            }
        })
        
    except (ValueError, TypeError) as e:
        return Response(
            {'error': f'Invalid parameters: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f'Error in doctor recommendations: {str(e)}')
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
