from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'name', 'mobile_number', 'role', 'is_active', 'is_staff')
    search_fields = ('email', 'name')
    readonly_fields = ()
