from django.contrib import admin
from .models import Doctor

class DoctorAdmin(admin.ModelAdmin):
    list_display = ['name', 'specialization', 'experience', 'mobile_number', 'hospital']
    list_filter = ['specialization', 'hospital']
    search_fields = ['name', 'specialization', 'mobile_number']
    ordering = ['name']

admin.site.register(Doctor, DoctorAdmin) 