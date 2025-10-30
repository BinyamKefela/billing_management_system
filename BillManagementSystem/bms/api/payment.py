from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.contrib.auth import get_user_model
from ..models import Payment, PaymentBill, Bill
from ..serializers import PaymentSerializer
from bms.api.custom_pagination import CustomPagination
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions

User = get_user_model()


from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Payment
from ..serializers import PaymentSerializer
from bms.api.custom_pagination import CustomPagination


class PaymentListView(generics.ListAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    pagination_class = CustomPagination

    # Search and ordering
    search_fields = ['payment_method', 'reference_number']
    ordering_fields = [field.name for field in Payment._meta.fields]
    ordering = ['id']
    filterset_fields = {
        'amount': ['exact', 'gte', 'lte'],
        'payment_method': ['exact'],
        'customer__id': ['exact'],
        'customer__email': ['exact'],
        'payment_bills__bill__bill_number': ['exact'],
        'payment_bills__bill__biller__user__id': ['exact'],
    }

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Payment.objects.all()

        if getattr(user, "is_biller", False):
            return Payment.objects.filter(
                payment_bills__bill__biller__user=user
            ).distinct()

        return Payment.objects.filter(customer=user).distinct()


class PaymentRetrieveView(generics.RetrieveAPIView):
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
    

class PaymentCreateView(generics.CreateAPIView):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class BulkPaymentCreateView(APIView):
    """
    Create one Payment and multiple PaymentBill allocations atomically.
    """
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Create a payment and allocate it across multiple bills.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'allocations': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'bill_id': openapi.Schema(type=openapi.TYPE_INTEGER, example=1),
                            'amount_applied': openapi.Schema(type=openapi.TYPE_NUMBER, example=500.00),
                        },
                        required=['bill_id', 'amount_applied']
                    ),
                ),
                'payment_method': openapi.Schema(type=openapi.TYPE_STRING, example='bank_transfer'),
                'reference_number': openapi.Schema(type=openapi.TYPE_STRING, example='REF12345'),
                'notes': openapi.Schema(type=openapi.TYPE_STRING, example='October payments'),
            },
            required=['allocations', 'payment_method']
        ),
        responses={201: "Created", 400: "Invalid input"}
    )
    def post(self, request):
        user = request.user
        allocations = request.data.get("allocations", [])
        payment_method = request.data.get("payment_method")
        reference_number = request.data.get("reference_number")
        notes = request.data.get("notes")

        if not allocations or not isinstance(allocations, list):
            return Response({"error": "allocations must be a non-empty list"}, status=400)

        total_amount = sum(float(a["amount_applied"]) for a in allocations)

        try:
            with transaction.atomic():
                payment = Payment.objects.create(
                    customer=user,
                    amount=total_amount,
                    payment_method=payment_method,
                    reference_number=reference_number,
                    notes=notes,
                )

                created_allocations = []
                for alloc in allocations:
                    bill = Bill.objects.get(id=alloc["bill_id"])
                    PaymentBill.objects.create(
                        payment=payment,
                        bill=bill,
                        amount_applied=alloc["amount_applied"]
                    )
                    created_allocations.append({
                        "bill_id": bill.id,
                        "bill_number": bill.bill_number,
                        "amount_applied": alloc["amount_applied"],
                        "bill_status": bill.status
                    })

                return Response({
                    "message": "Payment created successfully",
                    "payment_id": payment.id,
                    "total_amount": total_amount,
                    "allocations": created_allocations
                }, status=201)

        except Bill.DoesNotExist:
            return Response({"error": "Invalid Bill ID"}, status=400)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
