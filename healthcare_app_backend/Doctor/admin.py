from django.contrib import admin
from .models import Doctor

class DoctorAdmin(admin.ModelAdmin):
<<<<<<< HEAD
    list_display = ['doctor_name', 'specialization', 'experience_years', 'mobile_number', 'hospital']
    list_filter = ['specialization', 'hospital']
    search_fields = ['doctor_name', 'specialization', 'mobile_number']
    ordering = ['doctor_name']

admin.site.register(Doctor, DoctorAdmin)
=======
    list_display = ['name', 'specialization', 'experience', 'mobile_number', 'hospital']
    list_filter = ['specialization', 'hospital']
    search_fields = ['name', 'specialization', 'mobile_number']
    ordering = ['name']

admin.site.register(Doctor, DoctorAdmin) 
>>>>>>> dfa72382cbf12758b34e97a989f26c0ca80c5543
