from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import HealthcareUserSerializer
from .models import HealthcareUser, UserSearch, SavedDoctor
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
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
        username = request.data.get("username").lower()
        password = request.data.get("password")
        
        user = authenticate(username=username, password=password)

        if user is not None:
            # Create JWT Token
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        else:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)
        


class RegisterHealthcareUserView(APIView):
    def post(self, request):
        try:
            serializer = HealthcareUserSerializer(data=request.data)

<<<<<<< HEAD
            # Check if the email is already registered - using count() instead of exists() to avoid djongo recursion
            try:
                email = request.data.get('email')
                if email and HealthcareUser.objects.filter(email=email).count() > 0:
                    return Response({"email": "This email is already registered."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as db_error:
                logger.error(f"Database error during email check: {str(db_error)}")
                logger.error(f"Full traceback: {traceback.format_exc()}")
                return Response(
                    {"error": "Database error during registration"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
=======
            # Check if the email is already registered
            if HealthcareUser.objects.filter(email=request.data.get('email')).exists():
                return Response({"email": "This email is already registered."}, status=status.HTTP_400_BAD_REQUEST)
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543

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
                            'name': f"{user.first_name} {user.last_name}",
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
                        logger.error(f"Doctor data: name={user.first_name} {user.last_name}, mobile={user.mobile_number}, specialization={specialization}, experience={experience}")
                        logger.error(f"Full traceback: {traceback.format_exc()}")
                        
                        # We'll still return success for the user registration
                        return Response({
                            "message": "User registered successfully, but doctor profile creation failed.", 
                            "user_id": user.id,
                            "warning": "Doctor profile could not be created. Please contact support."
                        }, status=status.HTTP_201_CREATED)
                
                return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)
            
            # Handle serializer errors
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Registration failed: {str(e)}")
            logger.error(f"Request data: {request.data}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return Response(
                {"error": f"Registration failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    
class loginHealthcareUserView(APIView):
    def post(self, request):
        try:
            email = request.data['email']
            password = request.data['password']
            user = HealthcareUser.objects.get(email=email)
            if user:
                if check_password(password, user.password):
                    # Create JWT tokens for authentication
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        "message": "Login successful",
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                        "user_id": user.id,
                        "role": user.role
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({"message": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
            else:
                return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except HealthcareUser.DoesNotExist:
            return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"message": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HealthcareUserListView(APIView):
    def get(self, request):
        users = HealthcareUser.objects.all()
        serializer = HealthcareUserSerializer(users, many=True)
        return Response(serializer.data)
    
# New API endpoints for user profile and recommendations

class UserProfileView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the user's profile information"""
        try:
            user = request.user
            if isinstance(user, HealthcareUser):
                serializer = HealthcareUserSerializer(user)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                # Try to find the user in the HealthcareUser model
                try:
                    healthcare_user = HealthcareUser.objects.get(email=user.username)
                    serializer = HealthcareUserSerializer(healthcare_user)
                    return Response(serializer.data, status=status.HTTP_200_OK)
                except HealthcareUser.DoesNotExist:
                    return Response({"message": "User profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserSearchesView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the user's recent searches"""
        try:
            user = request.user
            healthcare_user = None
            
            if isinstance(user, HealthcareUser):
                healthcare_user = user
            else:
                try:
                    healthcare_user = HealthcareUser.objects.get(email=user.username)
                except HealthcareUser.DoesNotExist:
                    pass
            
            if healthcare_user:
                searches = UserSearch.objects.filter(user=healthcare_user).order_by('-timestamp')[:10]
                search_list = [search.query for search in searches]
                return Response({"searches": search_list}, status=status.HTTP_200_OK)
            else:
                return Response({"searches": []}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Save a new search query"""
        try:
            query = request.data.get('query')
            if not query:
                return Response({"message": "Query is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            user = request.user
            healthcare_user = None
            
            if isinstance(user, HealthcareUser):
                healthcare_user = user
            else:
                try:
                    healthcare_user = HealthcareUser.objects.get(email=user.username)
                except HealthcareUser.DoesNotExist:
                    return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            if healthcare_user:
                # Check if this search already exists
                existing_search = UserSearch.objects.filter(user=healthcare_user, query=query).first()
                if existing_search:
                    # Update the timestamp
                    existing_search.save()
                else:
                    # Create a new search entry
                    UserSearch.objects.create(user=healthcare_user, query=query)
                
                return Response({"message": "Search saved"}, status=status.HTTP_201_CREATED)
            else:
                return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SavedDoctorsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get the user's saved doctors"""
        try:
            user = request.user
            healthcare_user = None
            
            if isinstance(user, HealthcareUser):
                healthcare_user = user
            else:
                try:
                    healthcare_user = HealthcareUser.objects.get(email=user.username)
                except HealthcareUser.DoesNotExist:
                    pass
            
            if healthcare_user:
                saved = SavedDoctor.objects.filter(user=healthcare_user).select_related('doctor')
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
            else:
                return Response({"doctors": []}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Save a doctor to the user's favorites"""
        try:
            doctor_id = request.data.get('doctor_id')
            if not doctor_id:
                return Response({"message": "Doctor ID is required"}, status=status.HTTP_400_BAD_REQUEST)
                
            user = request.user
            healthcare_user = None
            
            if isinstance(user, HealthcareUser):
                healthcare_user = user
            else:
                try:
                    healthcare_user = HealthcareUser.objects.get(email=user.username)
                except HealthcareUser.DoesNotExist:
                    return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            try:
                doctor = Doctor.objects.get(id=doctor_id)
            except Doctor.DoesNotExist:
                return Response({"message": "Doctor not found"}, status=status.HTTP_404_NOT_FOUND)
                
            if healthcare_user:
                # Check if already saved
                saved = SavedDoctor.objects.filter(user=healthcare_user, doctor=doctor).first()
                if saved:
                    return Response({"message": "Doctor already saved"}, status=status.HTTP_200_OK)
                    
                # Save the doctor
                SavedDoctor.objects.create(user=healthcare_user, doctor=doctor)
                return Response({"message": "Doctor saved successfully"}, status=status.HTTP_201_CREATED)
            else:
                return Response({"message": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RecommendedConditionsView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get recommended conditions based on user profile and search history"""
        try:
            user = request.user
            healthcare_user = None
            
            if isinstance(user, HealthcareUser):
                healthcare_user = user
            else:
                try:
                    healthcare_user = HealthcareUser.objects.get(email=user.username)
                except HealthcareUser.DoesNotExist:
                    pass
            
            if healthcare_user:
                # Get common conditions from user's search history
                searches = UserSearch.objects.filter(user=healthcare_user).order_by('-timestamp')[:5]
                search_terms = [search.query for search in searches]
                
                # Get conditions from doctors the user has saved
                saved_doctors = SavedDoctor.objects.filter(user=healthcare_user).select_related('doctor')
                saved_conditions = []
                
                for saved in saved_doctors:
                    if hasattr(saved.doctor, 'conditions_treated') and saved.doctor.conditions_treated:
                        saved_conditions.extend(saved.doctor.conditions_treated)
                
                # Combine with some common conditions based on user's age/gender if available
                # For now, use a fixed set of common health conditions
                common_conditions = ["Asthma", "Diabetes", "Heart Disease", "Hypertension", "Arthritis"]
                
                # Combine all sources, prioritizing user's history
                all_conditions = search_terms + saved_conditions + common_conditions
                
                # Remove duplicates while preserving order
                unique_conditions = []
                for condition in all_conditions:
                    if condition not in unique_conditions:
                        unique_conditions.append(condition)
                
                return Response({"conditions": unique_conditions[:10]}, status=status.HTTP_200_OK)
            else:
                # Return some default conditions if user not found
                return Response({"conditions": ["Asthma", "Diabetes", "Heart Disease", "Hypertension", "Arthritis"]}, 
                                status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Temporary test view for Doctor model creation
class TestDoctorCreationView(APIView):
    def get(self, request):
        try:
            # Test Doctor object creation directly
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
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    
