from django.contrib import admin
from .models import Doctor

class DoctorAdmin(admin.ModelAdmin):
    list_display = ['doctor_name', 'specialization', 'experience_years', 'mobile_number', 'hospital']
    list_filter = ['specialization', 'hospital']
    search_fields = ['doctor_name', 'specialization', 'mobile_number']
    ordering = ['doctor_name']

admin.site.register(Doctor, DoctorAdmin)
