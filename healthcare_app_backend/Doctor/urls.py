from django.urls import path
from . import views

urlpatterns = [
    path('list/', views.get_doctors, name='doctor-list'),
    path('list-all-doctors/', views.list_all_doctors, name='list-all-doctors'),
    path('doctors/all/', views.list_all_doctors, name='doctors-all'),
    path('specializations/', views.get_specialization_options, name='specialization-options'),
    path('details/<int:id>/', views.doctor_details_view, name='doctor-details'),
    path('profile/', views.manage_doctor_profile, name='doctor-profile'),
    path('register/', views.DoctorRegistrationView.as_view(), name='doctor-register'),
    path('book-appointment/', views.book_appointment, name='book-appointment'),
    path('appointments/', views.doctor_appointments, name='doctor-appointments'),
    path('user-appointments/', views.UserAppointmentsView.as_view(), name='user-appointments'),
    path('check-appointment-conflict/', views.check_appointment_conflict, name='check-appointment-conflict'),
    path('recommendations/', views.get_doctor_recommendations, name='doctor-recommendations'),
]
