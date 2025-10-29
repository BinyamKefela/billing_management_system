# views.py
from rest_framework import generics, permissions
from ..models import Bill
from ..serializers import BillSerializer
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.filters import OrderingFilter,SearchFilter
from bms.api.custom_pagination import CustomPagination
import datetime
from django_filters.rest_framework import DjangoFilterBackend


User = get_user_model()

class BillListView(generics.ListAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filter_backends = [SearchFilter, OrderingFilter,DjangoFilterBackend]
    search_fields = [field.name for field in Bill._meta.fields]
    ordering_fields = [field.name for field in Bill._meta.fields]
    ordering = ['id']
    pagination_class = CustomPagination
    filterset_fields = {
        'customer__email':['exact'],
        'biller__company_name':['exact'],
        'bill_number':['exact'],
        'biller__user__id':['exact'],
        'status':['exact'],
        
    }
    
    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Bill.objects.all()

        if user.is_biller:
            return Bill.objects.filter(biller__user=user)

        return Bill.objects.filter(customer=user)


class BillRetrieveView(generics.RetrieveAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    

class BillCreateView(generics.CreateAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class BillUpdateView(generics.UpdateAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    

class BillDeleteView(generics.DestroyAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
