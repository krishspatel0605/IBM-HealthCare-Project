from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import User
from .models import Appointment
from Doctor.models import Doctor
from rest_framework.views import APIView


from    .permissions import IsAdminUser

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_dashboard_overview(request):
    return Response({
        "total_users": User.objects.filter(role='user').count(),
        "total_doctors": Doctor.objects.count(),
        "total_appointments": Appointment.objects.count()
    })



from .serializers import HealthcareUserSerializer
from .permissions import IsAdminUser

class UserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all()
        serializer = HealthcareUserSerializer(users, many=True)
        return Response(serializer.data)
    
    
    
class UserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, id):
        user = User.objects.get(id=id)
        serializer = HealthcareUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class UserDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, id):
        user = User.objects.get(id=id)
        user.is_active = False  # Deactivate user instead of deleting
        user.save()
        return Response({"message": "User deactivated"})
