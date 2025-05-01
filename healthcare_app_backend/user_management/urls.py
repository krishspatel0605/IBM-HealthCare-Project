from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Authentication endpoints
    path('register/', views.RegisterUserView.as_view(), name='user_registration'),
    path('login/', views.LoginView.as_view(), name='user_login'),
    path('verify-login-otp/', views.LoginOTPVerifyView.as_view(), name='verify-login-otp'),
    path('resend-login-otp/', views.ResendLoginOTPView.as_view(), name='resend-login-otp'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User data endpoints
    path('user-profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('user-searches/', views.UserSearchesView.as_view(), name='user-searches'),
    path('saved-doctors/', views.SavedDoctorsView.as_view(), name='saved-doctors'),
    path('recommended-conditions/', views.RecommendedConditionsView.as_view(), name='recommended-conditions'),
    
    # Verification endpoints
    path('verify-email/', views.verify_email, name='verify_email'),
    path('send-otp/', views.send_otp, name='send_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('reset-password/', views.reset_password, name='reset_password'),
    path('check-auth/', views.check_auth, name='check_auth'),
]