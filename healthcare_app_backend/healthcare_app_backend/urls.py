from django.contrib import admin
from django.urls import path, include 

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('user_management.urls')),
    path('api/', include('hospital.urls')),
    path('api/', include('Doctor.urls')),
    path('api/admin/', include('user_management.admin_urls')),
]
