from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('user_management.urls')),
    path('api/', include('hospital.urls')),
    path('api/', include('Doctor.urls')),
]
