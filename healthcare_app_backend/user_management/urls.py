from django.urls import path
from .views import (
    RegisterUserView,
    LoginView,
    UserProfileView,
    UserSearchesView,
    SavedDoctorsView,
    RecommendedConditionsView,
    TestDoctorCreationView,
    UserAppointmentsView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('api/register/', RegisterUserView.as_view(), name='register_user'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/healthcare-users/', UserProfileView.as_view(), name='user_profile'),
    
    # JWT token refresh endpoint
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile and personalization endpoints
    path('api/user-profile/', UserProfileView.as_view(), name='user_profile'),
    path('api/user-searches/', UserSearchesView.as_view(), name='user_searches'),
    path('api/save-search/', UserSearchesView.as_view(), name='save_search'),
    path('api/saved-doctors/', SavedDoctorsView.as_view(), name='saved_doctors'),
    path('api/save-doctor/', SavedDoctorsView.as_view(), name='save_doctor'),
    path('api/recommended-conditions/', RecommendedConditionsView.as_view(), name='recommended_conditions'),
    
    # Test endpoint
    path('api/test-doctor-creation/', TestDoctorCreationView.as_view(), name='test_doctor_creation'),

]
