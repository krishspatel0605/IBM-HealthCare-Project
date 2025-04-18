from django.urls import path
from .views import (
    get_doctors, 
    get_specialization_options, 
    doctor_details_view, 
    recommend_doctors,
    manage_doctor_profile,
    list_all_doctors
)

urlpatterns = [
    path('doctors/', get_doctors, name='get-doctors'),
    path('specialization-options/', get_specialization_options, name='specialization-options'),
    path('doctor_details/<int:id>/', doctor_details_view, name='doctor-details'),
    path('doctor-profile/<str:email>/', manage_doctor_profile, name='doctor-profile'),
    path('doctor-profile/', manage_doctor_profile, name='doctor-profile-no-email'),
    path('list-all-doctors/', list_all_doctors, name='list-all-doctors'),
    path('recommend-doctors/', recommend_doctors, name='recommend-doctors'),
    path('knn-recommend/', recommend_doctors, name='knn-recommend'),
] 