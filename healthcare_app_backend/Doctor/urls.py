from django.urls import path
from .views import (
    get_doctors, 
    get_specialization_options, 
    doctor_details_view, 
    recommend_doctors,
    recommend_nearest_doctors,
    manage_doctor_profile,
    list_all_doctors,
    DoctorRegistrationView,
    book_appointment,
    doctor_appointments,
    user_appointments,
    check_appointment_conflict,
    check_doctor_availability
)

urlpatterns = [
    path('doctors/', get_doctors, name='get-doctors'),
    path('specialization-options/', get_specialization_options, name='specialization-options'),
    path('doctor_details/<int:id>/', doctor_details_view, name='doctor-details'),
    path('doctor-profile/<str:email>/', manage_doctor_profile, name='doctor-profile'),
    path('doctor-profile/', manage_doctor_profile, name='doctor-profile-no-email'),
    path('list-all-doctors/', list_all_doctors, name='list-all-doctors'),
    path('recommend-doctors/', recommend_doctors, name='recommend-doctors'),
    path('recommend-nearest-doctors/', recommend_nearest_doctors, name='recommend-nearest-doctors'),
    path('register/', DoctorRegistrationView.as_view(), name='doctor-registration'),
    path('book-appointment/', book_appointment, name='book-appointment'),
    path('doctor-appointments/', doctor_appointments, name='doctor-appointments'),
    path('user-appointments/', user_appointments, name='user-appointments'),
    path('check-appointment-conflict/', check_appointment_conflict, name='check-appointment-conflict'),
    path('check-availability/<int:id>/', check_doctor_availability, name='check-doctor-availability'),
]
