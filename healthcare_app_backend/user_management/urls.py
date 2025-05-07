from django.urls import path
from .views import (
    RegisterUserView,
    LoginView,
    UserProfileView,
    UserSearchesView,
    SavedDoctorsView,
    RecommendedConditionsView,
    # TestDoctorCreationView,
    # UserAppointmentsView,
    ResendActivationOTPView,
    ResendLoginOTPView,
    ForgotPasswordView,
    ResetPasswordView,
    ActivationView,
    LoginOTPVerifyView,
    RoleBasedAccess,
    LogoutView,
    
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("register/", RegisterUserView.as_view(), name="register"),
    path("activate/", ActivationView.as_view(), name="activate"),
    path("login/", LoginView.as_view(), name="login"),
    path("verify-login-otp/", LoginOTPVerifyView.as_view(), name="verify_login_otp"),  # ✅ Fixed
    path("role-access/", RoleBasedAccess.as_view(), name="role_access"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path('resend-activation-otp/', ResendActivationOTPView.as_view(), name='resend-activation-otp'),
    path("resend-login-otp/", ResendLoginOTPView.as_view(), name="resend_login_otp"),
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot_password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset_password"),

    path('healthcare-users/', UserProfileView.as_view(), name='user_profile'),
    
    # JWT token refresh endpoint
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile and personalization endpoints
    path('user-profile/', UserProfileView.as_view(), name='user_profile'),
    path('user-searches/', UserSearchesView.as_view(), name='user_searches'),
    path('save-search/', UserSearchesView.as_view(), name='save_search'),
    path('saved-doctors/', SavedDoctorsView.as_view(), name='saved_doctors'),
    path('save-doctor/', SavedDoctorsView.as_view(), name='save_doctor'),
    path('recommended-conditions/', RecommendedConditionsView.as_view(), name='recommended_conditions'),
    
    # Test endpoint
    # path('test-doctor-creation/', TestDoctorCreationView.as_view(), name='test_doctor_creation'),
]
