from django.urls import path
from .views import (
    get_doctors, 
    get_specialization_options, 
    doctor_details_view, 
    recommend_doctors,
<<<<<<< HEAD
    recommend_nearest_doctors,
=======
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
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
<<<<<<< HEAD
    path('recommend-nearest-doctors/', recommend_nearest_doctors, name='recommend-nearest-doctors'),
]
=======
] 
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
