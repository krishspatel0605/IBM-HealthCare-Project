# Register your models here.
from django.contrib import admin
from .models import Hospital
from Doctor.models import Doctor

class DoctorInline(admin.TabularInline):
    model = Doctor
    extra = 1

class HospitalAdmin(admin.ModelAdmin):
    list_display = ('name', 'specialization', 'address', 'available_beds')
    search_fields = ('name', 'specialization', 'address')
    list_filter = ('specialization',)
    inlines = [DoctorInline]

admin.site.register(Hospital, HospitalAdmin)

