# views.py
from rest_framework import generics, permissions
from ..models import CustomerBiller
from ..serializers import CustomerBillerSerializer
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.filters import OrderingFilter,SearchFilter
from bms.api.custom_pagination import CustomPagination
import datetime
from django_filters.rest_framework import DjangoFilterBackend


User = get_user_model()

class CustomerBillerListView(generics.ListAPIView):
    queryset = CustomerBiller.objects.all()
    serializer_class = CustomerBillerSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filter_backends = [SearchFilter, OrderingFilter,DjangoFilterBackend]
    search_fields = [field.name for field in CustomerBiller._meta.fields]
    ordering_fields = [field.name for field in CustomerBiller._meta.fields]
    ordering = ['id']
    pagination_class = CustomPagination
    filterset_fields = {
        'user__email':['exact'],
        'user__id':['exact'],
        'biller__company_name':['exact'],
        'biller__id':['exact'],
        'address':['exact'],
        'phone_number':['exact'],
        
    }


class CustomerBillerRetrieveView(generics.RetrieveAPIView):
    queryset = CustomerBiller.objects.all()
    serializer_class = CustomerBillerSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class CustomerBillerCreateView(generics.CreateAPIView):
    queryset = CustomerBiller.objects.all()
    serializer_class = CustomerBillerSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class CustomerBillerUpdateView(generics.UpdateAPIView):
    queryset = CustomerBiller.objects.all()
    serializer_class = CustomerBillerSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    

class CustomerBillerDeleteView(generics.DestroyAPIView):
    queryset = CustomerBiller.objects.all()
    serializer_class = CustomerBillerSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
