from django.contrib.auth.models import Permission
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated,DjangoModelPermissions
from rest_framework.filters import OrderingFilter,SearchFilter
from ..serializers import PermissionSerializer
from bms.api.custom_pagination import CustomPagination

class PermissionListView(generics.ListAPIView):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated,DjangoModelPermissions]
    filter_backends = [OrderingFilter,SearchFilter]
    search_fields = [field.name for field in Permission._meta.fields]
    ordering_fields = [field.name for field in Permission._meta.fields]
    ordering = ['id']
    pagination_class = CustomPagination


class PermissionRetrieveView(generics.RetrieveAPIView):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    lookup_field = 'id'

class PermissionUpdateView(generics.UpdateAPIView):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    lookup_field = 'id'

class PermissionDestroyView(generics.DestroyAPIView):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    lookup_field = 'id'

    def destroy(self, request, *args, **kwargs):
        permission = self.get_object()
        if not permission:
            return Response({"error":"permission not found!"}, status=status.HTTP_404_NOT_FOUND)
        permission.delete()
        #permission.save()
        return Response({"message":"permission deleted successfully!"},status=status.HTTP_200_OK)

class PermissionCreateView(generics.CreateAPIView):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    