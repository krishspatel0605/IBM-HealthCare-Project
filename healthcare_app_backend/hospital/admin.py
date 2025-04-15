# Register your models here.
from django.contrib import admin
from .models import Hospital

class HospitalAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'specialization', 'location', 'available_beds')
    search_fields = ('name', 'specialization', 'location')
    list_filter = ('specialization', 'location')

admin.site.register(Hospital, HospitalAdmin)

# from django.contrib import admin
from .models import Hospital_Details , Doctor

class DoctorInline(admin.TabularInline):
    model = Doctor
    extra = 1



class Hospital_Details_Admin(admin.ModelAdmin):
    list_display = ('id','name', 'location', 'available_beds')
    inlines = [DoctorInline]  # This will show doctors inside hospital admin panel

admin.site.register(Hospital_Details, Hospital_Details_Admin)

