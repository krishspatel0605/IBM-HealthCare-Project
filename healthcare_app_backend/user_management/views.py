from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import HealthcareUserSerializer
from .models import HealthcareUser
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate

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
        serializer = HealthcareUserSerializer(data=request.data)

        # Check if the email is already registered
        if HealthcareUser.objects.filter(email=request.data.get('email')).exists():
            return Response({"email": "This email is already registered."}, status=status.HTTP_400_BAD_REQUEST)

        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)
    
        
        # Handle serializer errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
class loginHealthcareUserView(APIView):
    def post(self, request):
        try:
            email = request.data['email']
            password = request.data['password']
            user = HealthcareUser.objects.get(email=email)
            if user:
                if check_password(password, user.password):
                    return Response({"message": "Login successful"}, status=status.HTTP_200_OK)
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
    
    
