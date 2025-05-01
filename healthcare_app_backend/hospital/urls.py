from django.urls import path
from . import views

urlpatterns = [
    path('list/', views.get_hospitals, name='hospital-list'),
    path('diseases/', views.get_disease_options, name='disease-options'),
    path('details/<int:id>/', views.Hospital_Details_View, name='hospital-details'),
    path('recommendations/', views.get_hospital_recommendations, name='hospital-recommendations'),
]
