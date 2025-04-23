from django.urls import path
from .views import get_hospitals, get_disease_options, Hospital_Details_View

urlpatterns = [
    path('hospitals/', get_hospitals, name='get-hospitals'),
    path('disease-options/', get_disease_options, name='disease-options'),
    path('hospital_details/<int:id>/', Hospital_Details_View, name='hospital_details'),   
]
