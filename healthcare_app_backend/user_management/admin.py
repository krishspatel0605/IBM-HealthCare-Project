from django.contrib import admin
from .models import HealthcareUser

@admin.register(HealthcareUser)
class HealthcareUserAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'email', 'mobile_number', 'role', 'created_at')
    search_fields = ('email', 'first_name', 'last_name')
    readonly_fields = ('created_at', 'updated_at')
