# views.py
from rest_framework import generics, permissions
from ..models import Notification
from ..serializers import NotificationSerializer
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.filters import OrderingFilter,SearchFilter
from bms.api.custom_pagination import CustomPagination
import datetime
from django_filters.rest_framework import DjangoFilterBackend


User = get_user_model()

class NotificationListView(generics.ListAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filter_backends = [SearchFilter, OrderingFilter,DjangoFilterBackend]
    search_fields = [field.name for field in Notification._meta.fields]
    ordering_fields = [field.name for field in Notification._meta.fields]
    ordering = ['id']
    pagination_class = CustomPagination
    filterset_fields = {
        'bill__bill_number':['exact'],
        'customer__id':['exact'],
        'customer__email':['exact'],
        'bill__biller__user__id':['exact'],
        'bill__biller__user__email':['exact'],
        'notification_type':['exact'],
        
    }


class NotificationRetrieveView(generics.RetrieveAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    

class NotificationCreateView(generics.CreateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class NotificationUpdateView(generics.UpdateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    

class NotificationDeleteView(generics.DestroyAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
