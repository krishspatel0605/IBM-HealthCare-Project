from django.urls import path
from .views import get_hospitals
from .views import get_disease_options
from .views import Hospital_Details_View , Hospital_Details

urlpatterns = [
    path('hospitals/', get_hospitals, name='get-hospitals'),
    path('disease-options/', get_disease_options, name='disease-options'),
    path('hospital_details/<int:id>/', Hospital_Details_View, name='hospital_details'),   
    
]   
