import jwt
import uuid
import random
from django.contrib.auth import get_user_model, authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .permissions import IsDoctor, IsUser  # Import role-based permissions
from django.utils.timezone import now
from datetime import timedelta
from django.utils.crypto import get_random_string
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import get_user_model
from django.conf import settings
from .models import ActivationToken  # Import ActivationToken model
from .models import ActivationToken, User , PasswordResetToken
    # Ensure correct imports
import requests


User = get_user_model()

    # Function to generate a 6-digit OTP
def generate_otp():
        return str(random.randint(100000, 999999))

    # 🚀 1. User Registration (Patient or Doctor)
from django.template.loader import render_to_string  # Import Django's email template renderer

from django.utils.timezone import now
from django.core.mail import send_mail
from rest_framework.permissions import AllowAny


class RegisterUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower()
        mobile_number = request.data.get("mobile_number")
        name = request.data.get("name")
        password = request.data.get("password")
        role = request.data.get("role", "user")  # Default role
        address = request.data.get("address")
        date_of_birth = request.data.get("date_of_birth")

        if role not in ["user", "doctor"]:
            return Response({'error': 'Invalid role selected.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists() or User.objects.filter(mobile_number=mobile_number).exists():
            return Response({'error': 'Email or mobile number already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate OTP and token for email activation
        email_otp = get_random_string(6, '0123456789')
        activation_token = get_random_string(32)

        # Store user data temporarily in ActivationToken
        ActivationToken.objects.update_or_create(
            email=email,
            defaults={
                'otp': email_otp,
                'token': activation_token,
                'created_at': now(),
                'user_data': {
                    'name': name,
                    'mobile_number': mobile_number,
                    'password': make_password(password),  # Hash password
                    'role': role,
                    'address': address,
                    'date_of_birth':date_of_birth,
                }
            }
        )

        # Create frontend activation link
        activation_link = f"{settings.FRONTEND_URL}/activate?token={activation_token}&email={email}"

        # Send activation email with OTP and link
        self.send_activation_email(email_otp, name, activation_link, email)

        return Response({'message': 'OTP sent to email. Please verify to activate your account.'}, status=status.HTTP_201_CREATED)

    def send_activation_email(self, email_otp, name, activation_link, email):
        email_subject = "🚀 Activate Your Healthcare System Account"
        email_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #4CAF50;">Account Activation - Healthcare System</h2>
            <p>Hello {name},</p>

            <p>Thank you for registering with the Healthcare System. To activate your account, please use the OTP below or click the activation link.</p>

            <h1 style="color: #d9534f; text-align: center;">{email_otp}</h1>

            <p style="text-align: center;">
                <a href="{activation_link}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Activate Your Account
                </a>
            </p>

            <p><b>Note:</b> This OTP and activation link will expire in <b>10 minutes</b>. Do not share your OTP with anyone.</p>

            <p>If you did not request this, please ignore this email.</p>

            <br>
            <p>Best regards,</p>
            <p><b>Healthcare System Team</b></p>
        </body>
        </html>
        """

        send_mail(
            subject=email_subject,
            message='',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email],
            html_message=email_body,
            fail_silently=False,
        )

    # 🚀 2. User Activation (OTP Verification)
class ActivationView(APIView):
        permission_classes = []

        def post(self, request):
            token = request.data.get("token")
            email_otp = request.data.get("otp")

            if not token or not email_otp:
                return Response({'error': 'Token and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

            activation_entry = ActivationToken.objects.filter(token=token).first()

            if not activation_entry:
                return Response({'error': 'Invalid or expired activation token.'}, status=status.HTTP_400_BAD_REQUEST)

            if activation_entry.is_expired():
                activation_entry.delete()
                return Response({'error': 'OTP expired. Please try registering again after 30 minutes.'}, status=status.HTTP_400_BAD_REQUEST)

            if activation_entry.otp.strip() != email_otp.strip():
                return Response({'error': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ OTP is correct — now create the user
            try:
                user_data = activation_entry.user_data  # Dictionary
                user = User.objects.create(
                    email=activation_entry.email,
                    name=user_data['name'],
                    mobile_number=user_data['mobile_number'],
                    password=make_password(user_data['password']),
                    role=user_data.get('role', 'user'),
                    address=user_data.get('address', ''),
                    date_of_birth=user_data.get('date_of_birth'),
                    is_active=True,
                )
                activation_entry.delete()
                return Response({'success': True, 'message': 'Account activated successfully.'})
            except Exception as e:
                return Response({'error': f'User creation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    # 🚀 3. Login (OTP Sent)
from django.utils.timezone import now, timedelta
  # Ensure you import your custom User model

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.utils.timezone import now
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.utils.crypto import get_random_string
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower()
        password = request.data.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not check_password(password, user.password):
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Account not activated.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Generate OTP
        login_otp = get_random_string(6, '0123456789')
        user.email_otp = login_otp
        user.otp_expiry = now() + timedelta(minutes=5)
        user.save()

        # Send OTP via email
        send_login_otp_email(user, login_otp)

        return Response({
            'message': 'OTP sent to your email. Verify to complete login.',
            'otp_required': True
        }, status=status.HTTP_200_OK)

def send_login_otp_email(user, otp):
    email_subject = "🔐 Secure Login OTP - Healthcare System"
    email_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Login Verification - Your OTP Code</h2>
        <p>Hello {user.name},</p>

        <p>We received a request to log into your Healthcare System account.</p>

        <h1 style="color: #d9534f; text-align: center;">{otp}</h1>

        <p><b>Note:</b> This OTP is valid for <b>5 minutes</b>. Please do not share it with anyone.</p>

        <p>If you did not attempt to log in, please ignore this email.</p>

        <p>Best regards,</p>
        <p><b>Healthcare System Team</b></p>
    </body>
    </html>
    """

    send_mail(
        email_subject,
        '',
        settings.EMAIL_HOST_USER,
        [user.email],
        html_message=email_body,
        fail_silently=False,
    )



    # 🚀 4. OTP Verification for Login
from rest_framework_simplejwt.tokens import RefreshToken

class LoginOTPVerifyView(APIView):
        permission_classes = [AllowAny]

        def post(self, request):
            email = request.data.get("email")
            otp = request.data.get("email_otp")

            if not email or not otp:
                return Response({'error': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

            email = email.lower()

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

            # ✅ Check OTP validity using email_otp and otp_expiry
            if not user.email_otp or user.email_otp != otp or not user.otp_expiry or user.otp_expiry < now():
                return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_401_UNAUTHORIZED)

            # ✅ Clear OTP after successful verification
            user.email_otp = None
            user.otp_expiry = None
            user.save()

            # ✅ Generate JWT Token
            refresh = RefreshToken.for_user(user)

            return Response({
                'message': 'Login successful 🎉',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'role': user.role
            }, status=status.HTTP_200_OK)
    # 🚀 5. Role-Based Access Control
class RoleBasedAccess(APIView):
        permission_classes = [IsAuthenticated]

        def get(self, request):
            user = request.user

            if user.role == "doctor":
                return Response({"message": "Welcome, Doctor! You have access to doctor-specific features."}, status=200)
            elif user.role == "user":
                return Response({"message": "Welcome, Patient! You have access to patient-specific features."}, status=200)
            else:
                return Response({"error": "Unauthorized role."}, status=status.HTTP_403_FORBIDDEN)

    # 🚀 6. Doctor-Only Dashboard
class DoctorDashboardView(APIView):
        permission_classes = [IsAuthenticated, IsDoctor]

        def get(self, request):
            return Response({"message": "Welcome, Doctor! You have exclusive access."})

    # 🚀 7. User-Only Dashboard
class UserDashboardView(APIView):
        permission_classes = [IsAuthenticated, IsUser]

        def get(self, request):
            return Response({"message": "Welcome, Patient! You have exclusive access."})

    # 🚀 8. Logout
class LogoutView(APIView):
        permission_classes = [IsAuthenticated]

        def post(self, request):
            try:
                refresh_token = request.data.get("refresh_token")
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)



from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
@method_decorator(csrf_exempt, name='dispatch')  # ✅ CSRF disabled
class ResendActivationOTPView(APIView):
        permission_classes = [AllowAny]

        def post(self, request):
            email = request.data.get("email", "").lower()
            if not email:
                return Response({"error": "Email is required."}, status=400)

            activation_entry = ActivationToken.objects.filter(email=email).first()
            if not activation_entry:
                return Response({"error": "No pending activation found for this email."}, status=404)

            # Generate new OTP
            new_otp = get_random_string(6, '0123456789')
            activation_entry.otp = new_otp
            activation_entry.created_at = now()
            activation_entry.save()

            # Prepare email
            activation_link = f"{settings.FRONTEND_URL}/activate?token={activation_entry.token}"
            email_subject = "🔁 Your New OTP to Activate Your Account"
            email_body = f"""
            <html><body>
                <h2>Your new OTP is:</h2>
                <h1 style="color:#d9534f;">{new_otp}</h1>
                <p>Or <a href="{activation_link}">click here</a> to activate your account.</p>
            </body></html>
            """

            send_mail(
                subject=email_subject,
                message='',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                html_message=email_body,
            )

            return Response({"message": "New OTP sent."}, status=200)

from django.utils.timezone import now, timedelta
from django.utils.crypto import get_random_string

class ResendLoginOTPView(APIView):
        permission_classes = [AllowAny]

        def post(self, request):
            email = request.data.get("email", "").lower()

            # Check if user exists
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({'error': 'User not found. Please register first.'}, status=400)

            # Generate a new OTP
            new_otp = get_random_string(6, '0123456789')

            # ✅ Store OTP and expiry in correct fields
            user.email_otp = new_otp
            user.otp_expiry = now() + timedelta(minutes=5)
            user.save()

            # ✅ Email Content
            email_subject = "🔐 Secure Login OTP - Healthcare System"
            email_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4CAF50;">Login Verification - Your OTP Code</h2>
                <p>Hello {user.name},</p>

                <p>Use the following OTP to securely log into your Healthcare System account:</p>

                <h1 style="color: #d9534f; text-align: center;">{new_otp}</h1>

                <p><b>Note:</b> This OTP is valid for <b>5 minutes</b> only.</p>
                
                <p>If you did not request this, please ignore this email and do not share the OTP with anyone.</p>

                <p>Best regards,</p>
                <p><b>Healthcare System Team</b></p>
            </body>
            </html>
            """

            send_mail(
                subject=email_subject,
                message='',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                html_message=email_body,
                fail_silently=False,
            )

            return Response({"message": "New login OTP sent to your email."}, status=200)
class ForgotPasswordView(APIView):
        permission_classes = [AllowAny]

        def post(self, request):
            email = request.data.get("email").lower()

            user = User.objects.filter(email=email).first()
            if not user:
                return Response({'error': 'Email not registered.'}, status=400)

            # Generate reset token
            reset_token = get_random_string(64)
            PasswordResetToken.objects.update_or_create(
                email=email, defaults={'token': reset_token, 'created_at': now()}
            )


            reset_link = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
            email_subject = "🔑 Reset Your Password - Healthcare System"
            email_body = f"""
            <html>
            <body>
                <h2>Hello {user.name},</h2>
                <p>We received a request to reset your password. Click the link below to reset it:</p>
                
                <a href="{reset_link}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; font-weight: bold;">Reset Password</a>

                <p>If you did not request this, please ignore this email.</p>
                <p>Note: This link will expire in <b>15 minutes</b>.</p>

                <p>Best regards,<br><b>Healthcare System Team</b></p>
            </body>
            </html>
            """

            send_mail(
                email_subject,
                '',
                settings.EMAIL_HOST_USER,
                [email],
                html_message=email_body,
                fail_silently=False,
            )

            return Response({'message': 'Password reset email sent.'}, status=200)
        
        
        from django.contrib.auth.hashers import make_password

class ResetPasswordView(APIView):
        permission_classes = [AllowAny]

        def post(self, request):
            token = request.data.get("token")
            new_password = request.data.get("new_password")

            if not token or not new_password:
                return Response({'error': 'Token and new password are required.'}, status=400)

            reset_entry = PasswordResetToken.objects.filter(token=token).first()
            if not reset_entry or reset_entry.is_expired():
                return Response({'error': 'Invalid or expired token.'}, status=400)

            # Update user password
            user = User.objects.get(email=reset_entry.email)
            user.password = make_password(new_password)
            user.save()

            # Delete token after successful reset
            reset_entry.delete()

            return Response({'message': 'Password reset successfully.'}, status=200)


