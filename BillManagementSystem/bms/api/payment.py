# views.py
from rest_framework import generics, permissions
from ..models import Payment,Bill
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
    
    
    
from django.db import transaction
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi



class BulkPaymentCreateView(APIView):
    """
    Create multiple Payment instances for a list of bill IDs.
    Ensures atomicity — all succeed or all fail.
    """
    permission_classes = [permissions.IsAuthenticated]

    # Swagger schema
    @swagger_auto_schema(
        operation_description="Create multiple payments for given bill IDs. "
                              "All payments are created atomically (all or none).",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'bill_ids': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_INTEGER),
                    description='List of Bill IDs to create payments for',
                    example=[1, 2, 3]
                ),
                'amount': openapi.Schema(
                    type=openapi.TYPE_NUMBER,
                    format='decimal',
                    example=100.00
                ),
                'payment_method': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    enum=[method[0] for method in Payment.PAYMENT_METHODS],
                    example='mobile_money'
                ),
                'reference_number': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    example='REF12345'
                ),
                'notes': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    example='October bill payments'
                ),
            },
            required=['bill_ids', 'amount', 'payment_method']
        ),
        responses={
            201: openapi.Response(
                description="Payments created successfully",
                examples={
                    "application/json": {
                        "message": "Payments created successfully",
                        "payments": [
                            {"bill_id": 1, "amount": "100.00", "status": "paid"},
                            {"bill_id": 2, "amount": "100.00", "status": "paid"}
                        ]
                    }
                }
            ),
            400: "Invalid input or failed operation"
        }
    )
    def post(self, request, *args, **kwargs):
        user = request.user
        bill_ids = request.data.get("bill_ids")
        amount = request.data.get("amount")
        payment_method = request.data.get("payment_method")
        reference_number = request.data.get("reference_number", None)
        notes = request.data.get("notes", None)

        # Basic validation
        if not bill_ids or not isinstance(bill_ids, list):
            return Response({"error": "bill_ids must be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)
        if not amount:
            return Response({"error": "amount is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not payment_method:
            return Response({"error": "payment_method is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch all bills and ensure they exist
        bills = Bill.objects.filter(id__in=bill_ids)
        if bills.count() != len(bill_ids):
            missing = set(bill_ids) - set(bills.values_list('id', flat=True))
            return Response({"error": f"Invalid Bill IDs: {list(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Atomic transaction
        try:
            with transaction.atomic():
                created_payments = []
                for bill in bills:
                    payment = Payment.objects.create(
                        bill=bill,
                        customer=user,
                        amount=amount,
                        payment_method=payment_method,
                        reference_number=reference_number,
                        notes=notes,
                    )
                    created_payments.append({
                        "bill_id": bill.id,
                        "amount": str(payment.amount),
                        "status": bill.status,
                        "reference_number": payment.reference_number,
                    })

                return Response(
                    {"message": "Payments created successfully", "payments": created_payments},
                    status=status.HTTP_201_CREATED
                )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

