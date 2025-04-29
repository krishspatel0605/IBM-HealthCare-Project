from django.contrib import admin
from .models import Doctor

class DoctorAdmin(admin.ModelAdmin):
    list_display = ['name', 'specialization', 'experience_years', 'mobile_number', 'hospital', 'availability', 'consultation_fee_inr', 'rating']
    list_filter = ['specialization', 'hospital']
    search_fields = ['name', 'specialization', 'mobile_number']
    ordering = ['name']

admin.site.register(Doctor, DoctorAdmin)
