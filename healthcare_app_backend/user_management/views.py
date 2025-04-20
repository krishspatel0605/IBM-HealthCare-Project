from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer, AppointmentSerializer
from .models import User, UserSearch, SavedDoctor, Appointment
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from .permissions import IsUser
from django.contrib.auth import authenticate
from Doctor.models import Doctor  # Import the Doctor model from the Doctor app
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.decorators import authentication_classes, permission_classes
import logging
import traceback

# Set up logging
logger = logging.getLogger(__name__)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower()
        password = request.data.get("password")

        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

        # Create JWT Token
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_id': user.id,
            'role': user.role,
        })

class RegisterUserView(APIView):
    def post(self, request):
        try:
            serializer = UserSerializer(data=request.data)

            # Check if the email is already registered - using count() instead of exists() to avoid djongo recursion
            try:
                email = request.data.get('email')
                if email and User.objects.filter(email=email).count() > 0:
                    return Response({"email": "This email is already registered."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as db_error:
                logger.error(f"Database error during email check: {str(db_error)}")
                logger.error(f"Full traceback: {traceback.format_exc()}")
                return Response(
                    {"error": "Database error during registration"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            if serializer.is_valid():
                user = serializer.save()

                # If the user is registering as a doctor, create a Doctor instance too
                if user.role == 'doctor':
                    try:
                        # Extract doctor-specific fields from validated data or use defaults
                        specialization = request.data.get('specialization', 'General')
                        experience = request.data.get('experience', 0)
                        try:
                            experience = int(experience)  # Convert to int if it's a string
                        except (ValueError, TypeError):
                            experience = 0  # Default if conversion fails

                        # Log the data we're going to use to create the doctor
                        doctor_data = {
                            'name': user.name,
                            'mobile_number': user.mobile_number,
                            'specialization': specialization,
                            'experience': experience,
                            'availability': "10 AM - 5 PM",
                            'fee': 500,
                            'patients_treated': 0,
                            'rating': 4.0,
                            'conditions_treated': []  # Empty list for MongoDB JSONField
                        }
                        logger.info(f"Creating doctor with data: {doctor_data}")

                        try:
                            # Try to create a Doctor profile with the provided information
                            doctor = Doctor.objects.create(**doctor_data)
                            doctor_id = doctor.id
                        except Exception as inner_e:
                            # If Doctor creation fails, log it but continue with user creation
                            logger.error(f"Doctor model creation failed, proceeding with user only: {str(inner_e)}")
                            doctor_id = None

                        return Response({
                            "message": "Doctor registered successfully!",
                            "user_id": user.id,
                            "doctor_id": doctor_id
                        }, status=status.HTTP_201_CREATED)
                    except Exception as e:
                        # Log the specific error for debugging but don't delete the user
                        logger.error(f"Error in doctor registration process: {str(e)}")
                        logger.error(f"Doctor data: name={user.name}, mobile={user.mobile_number}, specialization={specialization}, experience={experience}")
                        logger.error(f"Full traceback: {traceback.format_exc()}")

                        # We'll still return success for the user registration
                        return Response({
                            "message": "User registered successfully, but doctor profile creation failed.",
                            "user_id": user.id,
                            "warning": "Doctor profile could not be created. Please contact support."
                        }, status=status.HTTP_201_CREATED)

                return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)

            # Handle serializer errors
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Registration failed: {str(e)}")
            logger.error(f"Request data: {request.data}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Registration failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserSearchesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            searches = UserSearch.objects.filter(user=user).order_by('-timestamp')[:10]
            search_list = [search.query for search in searches]
            return Response({"searches": search_list}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            query = request.data.get('query')
            if not query:
                return Response({"message": "Query is required"}, status=status.HTTP_400_BAD_REQUEST)

            user = request.user
            existing_search = UserSearch.objects.filter(user=user, query=query).first()
            if existing_search:
                existing_search.save()
            else:
                UserSearch.objects.create(user=user, query=query)

            return Response({"message": "Search saved"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SavedDoctorsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            saved = SavedDoctor.objects.filter(user=user).select_related('doctor')
            doctors = []

            for item in saved:
                doctor = item.doctor
                doctors.append({
                    'id': doctor.id,
                    'name': doctor.name,
                    'specialization': doctor.specialization,
                    'experience': doctor.experience,
                    'mobile_number': doctor.mobile_number,
                    'rating': doctor.rating,
                    'availability': doctor.availability,
                    'fee': doctor.fee,
                    'conditions_treated': doctor.conditions_treated if hasattr(doctor, 'conditions_treated') else []
                })

            return Response({"doctors": doctors}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            doctor_id = request.data.get('doctor_id')
            if not doctor_id:
                return Response({"message": "Doctor ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            user = request.user
            try:
                doctor = Doctor.objects.get(id=doctor_id)
            except Doctor.DoesNotExist:
                return Response({"message": "Doctor not found"}, status=status.HTTP_404_NOT_FOUND)

            saved = SavedDoctor.objects.filter(user=user, doctor=doctor).first()
            if saved:
                return Response({"message": "Doctor already saved"}, status=status.HTTP_200_OK)

            SavedDoctor.objects.create(user=user, doctor=doctor)
            return Response({"message": "Doctor saved successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RecommendedConditionsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            searches = UserSearch.objects.filter(user=user).order_by('-timestamp')[:5]
            search_terms = [search.query for search in searches]

            saved_doctors = SavedDoctor.objects.filter(user=user).select_related('doctor')
            saved_conditions = []

            for saved in saved_doctors:
                if hasattr(saved.doctor, 'conditions_treated') and saved.doctor.conditions_treated:
                    saved_conditions.extend(saved.doctor.conditions_treated)

            common_conditions = ["Asthma", "Diabetes", "Heart Disease", "Hypertension", "Arthritis"]

            all_conditions = search_terms + saved_conditions + common_conditions

            unique_conditions = []
            for condition in all_conditions:
                if condition not in unique_conditions:
                    unique_conditions.append(condition)

            return Response({"conditions": unique_conditions[:10]}, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Failed to fetch recommended conditions: {str(e)}")
            return Response({"error": "Failed to fetch recommended conditions"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TestDoctorCreationView(APIView):
    def get(self, request):
        try:
            doctor_data = {
                'name': "Test Doctor",
                'mobile_number': "1234567890",
                'specialization': "General",
                'experience': 5,
                'availability': "10 AM - 5 PM",
                'fee': 500,
                'patients_treated': 0,
                'rating': 4.0,
                'conditions_treated': []
            }
            logger.info(f"Test: Creating doctor with data: {doctor_data}")

            doctor = Doctor.objects.create(**doctor_data)

            return Response({
                "message": "Test doctor created successfully!",
                "doctor_id": doctor.id
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Test doctor creation failed: {str(e)}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Failed to create test doctor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserAppointmentsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, IsUser]

    def get(self, request):
        try:
            logger.debug(f"UserAppointmentsView GET called. request.user: {request.user}, request.auth: {request.auth}")
            logger.debug(f"User is_authenticated: {request.user.is_authenticated if hasattr(request.user, 'is_authenticated') else 'No is_authenticated attribute'}")
            logger.debug(f"User role: {getattr(request.user, 'role', 'No role attribute')}")
            logger.debug(f"User permissions: {request.user.get_all_permissions() if hasattr(request.user, 'get_all_permissions') else 'No get_all_permissions method'}")
            user = request.user
            appointments = Appointment.objects.filter(user=user).select_related('doctor').order_by('-appointment_date')
            serializer = AppointmentSerializer(appointments, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to fetch user appointments: {str(e)}")
            return Response({"error": "Failed to fetch user appointments"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
