from rest_framework.permissions import BasePermission

class IsDoctor(BasePermission):
    """
    Allows access only to users with the role 'doctor'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'doctor'


class IsUser(BasePermission):
    """
    Allows access only to users with the role 'user'.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'user'


from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'
