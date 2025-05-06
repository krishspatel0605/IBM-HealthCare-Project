from django.urls import path
from . import admin_views  # Make sure you are importing the admin_views module

urlpatterns = [
    path('overview/', admin_views.admin_dashboard_overview),
    path('users/', admin_views.UserListView.as_view(), name='user-list'),
    path('users/<int:id>/', admin_views.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:id>/deactivate/', admin_views.UserDeleteView.as_view(), name='user-deactivate'),
]
