from django.urls import path
from .views import RegisterHealthcareUserView , loginHealthcareUserView , HealthcareUserListView , LoginView

urlpatterns = [
    path('api/register/', RegisterHealthcareUserView.as_view(), name='register_healthcare_user'),
    path('api/login/', loginHealthcareUserView.as_view(), name='login_healthcare_user'),
 path('api/healthcare-users/', HealthcareUserListView.as_view(), name='healthcare-user-list'),
 path('api/admin-login/', LoginView.as_view(), name='login'),   
]
