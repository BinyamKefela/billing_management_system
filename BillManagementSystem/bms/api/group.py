from django.contrib.auth.models import Group,Permission
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated,DjangoModelPermissions
from rest_framework.filters import OrderingFilter,SearchFilter
from ..serializers import GroupSerializer
from bms.api.custom_pagination import CustomPagination
from rest_framework.decorators import api_view,permission_classes
from rest_framework import status
from rest_framework.response import Response


class GroupListView(generics.ListAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated,DjangoModelPermissions]
    filter_backends = [OrderingFilter,SearchFilter]
    search_fields = [field.name for field in Group._meta.fields]
    ordering_fields = [field.name for field in Group._meta.fields]
    ordering = ['id']
    pagination_class = CustomPagination


class GroupRetrieveView(generics.RetrieveAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    lookup_field = 'id'

class GroupUpdateView(generics.UpdateAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    lookup_field = 'id'

class GroupDestroyView(generics.DestroyAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    lookup_field = 'id'

    def destroy(self, request, *args, **kwargs):
        group = self.get_object()
        if not group:
            return Response({"error":"the group has not been found!"},status=status.HTTP_404_NOT_FOUND)
        group.delete()
        #group.save()
        return Response({"message":"group deleted successfully!"},status=status.HTTP_200_OK)
        

class GroupCreateView(generics.CreateAPIView):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


#-------------------------------------an API for assigning permissions to groups, we can either remove or add permissions to groups-----------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setGroupPermissions(request):
    if not request.user.has_perm('auth.change_group'):
        return Response({"message":"you don't have the permission to set group's permissions"},status=status.HTTP_403_FORBIDDEN)
    group_id = request.data.get("group_id")
    permission_code_names = request.data.get("permissions") 
    if not group_id or not permission_code_names:
        return Response({"message":"please provide group_id and permissions"},status=status.HTTP_400_BAD_REQUEST)
    try:
        group = Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return Response({"message":"group does not exist"},status=status.HTTP_404_NOT_FOUND)
    permissions = Permission.objects.filter(codename__in=permission_code_names)
    group.permissions.clear()
    group.permissions.set(permissions)
    return Response({"message":"permissions assigned to group succssfully!"},status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def getGroupPermission(request):
    if not request.has_perm('auth.view_group'):
        return Response({"message":"you don't have the permission to set group's permissions"},status=status.HTTP_403_FORBIDDEN)
    try:
        group = Group.objects.get(request.data.get('name'))
    except:
        return Response({"message":"group with then given name does'nt exist"}, status=status.HTTP_404_NOT_FOUND)
    permissions = group.permissions.values_list("name")
    return Response({"name":group.name,"group_permissions":permissions},status=status.HTTP_200_OK)
    