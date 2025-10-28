# views.py
from rest_framework import generics, permissions
from ..models import Biller
from ..serializers import BillerSerializer
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAuthenticated, DjangoModelPermissions
from rest_framework.filters import OrderingFilter,SearchFilter
from bms.api.custom_pagination import CustomPagination
import datetime
from django_filters.rest_framework import DjangoFilterBackend


User = get_user_model()

class BillerListView(generics.ListAPIView):
    queryset = Biller.objects.all()
    serializer_class = BillerSerializer
    permission_classes = []
    filter_backends = [SearchFilter, OrderingFilter,DjangoFilterBackend]
    search_fields = [
        'name',
        'company_name',
        'address',
        'phone_number',
        'email',
    ]
    ordering_fields = [field.name for field in Biller._meta.fields]
    ordering = ['id']
    pagination_class = CustomPagination
    filterset_fields = {
        'company_name':['exact'],
        'address':['exact'],
        'phone_number':['exact'],
        'email':['exact'],
        
    }


class BillerRetrieveView(generics.RetrieveAPIView):
    queryset = Biller.objects.all()
    serializer_class = BillerSerializer
    permission_classes = []


from django.db import transaction
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.core.mail import send_mail
from django.conf import settings
from urllib.parse import urljoin

from ..models import CustomUser, Biller, EmailVerification
from ..serializers import UserSerializer


class BillerRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    @swagger_auto_schema(
        operation_description="Register a new biller account. Sends email verification link.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["email", "password", "first_name", "last_name", "company_name"],
            properties={
                "email": openapi.Schema(type=openapi.TYPE_STRING, example="biller@company.com"),
                "password": openapi.Schema(type=openapi.TYPE_STRING, example="StrongPassword123!"),
                "first_name": openapi.Schema(type=openapi.TYPE_STRING, example="John"),
                "middle_name": openapi.Schema(type=openapi.TYPE_STRING, example="M."),
                "last_name": openapi.Schema(type=openapi.TYPE_STRING, example="Doe"),
                "phone_number": openapi.Schema(type=openapi.TYPE_STRING, example="+251912345678"),
                "company_name": openapi.Schema(type=openapi.TYPE_STRING, example="Ethiopia Water Utility"),
                "name": openapi.Schema(type=openapi.TYPE_STRING, example="Ethiopia Water Utility"),
                "address": openapi.Schema(type=openapi.TYPE_STRING, example="Addis Ababa, Bole"),
            },
        ),
        responses={
            201: openapi.Response("Biller registration successful"),
            400: openapi.Response("Bad request"),
            403: openapi.Response("Email already exists"),
        },
    )
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data

        if CustomUser.objects.filter(email=data.get("email")).exists():
            return Response(
                {"error": "This email already exists in the system"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = CustomUser(
            email=data.get("email"),
            first_name=data.get("first_name"),
            middle_name=data.get("middle_name"),
            last_name=data.get("last_name"),
            phone_number=data.get("phone_number"),
            address=data.get("address"),
            is_active=False,  # inactive until verified
            is_biller=True,
        )
        user.set_password(data.get("password"))
        user.save()

        biller = Biller.objects.create(
            user=user,
            name=data.get("name"),
            company_name=data.get("company_name"),
            address=data.get("address"),
            phone_number=data.get("phone_number"),
            email=data.get("email"),
        )

        verification = EmailVerification.objects.create(user=user)

        current_site = request.build_absolute_uri('/')
        mail_subject = "Verify your email address"
        verify_link = f"api/verify-email/{verification.token}"
        absolute_url = urljoin(current_site, verify_link)
        message = (
            f"Hi {user.first_name},\n\n"
            f"Thank you for registering your company, {biller.company_name}.\n"
            f"Please click on the link below to verify your email address:\n\n"
            f"{absolute_url}\n\n"
            f"Best regards,\nBilling System"
        )

        send_mail(mail_subject, message, settings.EMAIL_HOST_USER, [user.email])

        return Response(
            {
                "message": "Biller registration successful. Please check your email to verify your account.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

class BillerUpdateView(generics.UpdateAPIView):
    queryset = Biller.objects.all()
    serializer_class = BillerSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    

class BillerDeleteView(generics.DestroyAPIView):
    queryset = Biller.objects.all()
    serializer_class = BillerSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
