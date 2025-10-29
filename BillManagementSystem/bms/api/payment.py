# views.py
from rest_framework import generics, permissions
from ..models import Payment
from ..serializers import PaymentSerializer
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.filters import OrderingFilter,SearchFilter
from bms.api.custom_pagination import CustomPagination
import datetime
from django_filters.rest_framework import DjangoFilterBackend


User = get_user_model()

class PaymentListView(generics.ListAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filter_backends = [SearchFilter, OrderingFilter,DjangoFilterBackend]
    search_fields = [
        'payment_method',
        'reference_number',
    ]
    ordering_fields = [field.name for field in Payment._meta.fields]
    ordering = ['id']
    pagination_class = CustomPagination
    filterset_fields = {
        'amount':['exact'],
        'payment_method':['exact'],
        'customer__id':['exact'],
        'customer__email':['exact'],
        'bill__bill_number':['exact'],
        'bill__biller__user__id':['exact'],
        
    }
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Payment.objects.all()
        if user.is_biller:
            return Payment.objects.filter(bill__biller__user=user)
        return Payment.objects.filter(customer=user)

class PaymentRetrieveView(generics.RetrieveAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class PaymentCreateView(generics.CreateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class PaymentUpdateView(generics.UpdateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

   

class PaymentDeleteView(generics.DestroyAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
