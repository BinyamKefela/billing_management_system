from django.contrib.auth.models import Permission,Group
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated,DjangoModelPermissions
from rest_framework.filters import OrderingFilter,SearchFilter
from ..serializers import UserSerializer
from bms.api.custom_pagination import CustomPagination
from rest_framework.decorators import api_view,permission_classes
from rest_framework import status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework_simplejwt.tokens import RefreshToken,AccessToken
from django.urls import reverse
from django.contrib.sites.shortcuts import get_current_site
from rest_framework.exceptions import ValidationError, NotFound
from django.db.models import F, Value
from django.db.models.functions import Concat
import json
from ..models import *
from datetime import datetime
from rest_framework.permissions import AllowAny
import os
from django_filters.rest_framework import DjangoFilterBackend


User = get_user_model()
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
#SITE_URL = settings.SITE_URL

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated,DjangoModelPermissions]
    filter_backends = [OrderingFilter,SearchFilter,DjangoFilterBackend]
    search_fields = [field.name for field in User._meta.fields]
    ordering_fields = [field.name for field in User._meta.fields]
    ordering = ['id']
    pagination_class = CustomPagination
    filterset_fields = {
        'email': ['exact', 'icontains'],
        'first_name': ['exact', 'icontains'],
        'last_name': ['exact', 'icontains'],
        'is_active': ['exact'],
        'date_joined': ['exact', 'year__gt', 'year__lt'],
        'is_superuser': ['exact'],
        'groups__name': ['exact'],
        'is_biller': ['exact'],
        'is_customer': ['exact'],
        
    }


class UserRetrieveView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    lookup_field = 'id'

class UserUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    lookup_field = 'id'

class UserDestroyView(generics.DestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    lookup_field = 'id'

    def handle_exception(self, exc):
        if isinstance(exc,NotFound):
            return Response({"error":"There is no user with the given id!"},status=status.HTTP_400_BAD_REQUEST)

        return super().handle_exception(exc)

    def destroy(self, request, *args, **kwargs):
        user_to_deactivate = self.get_object()
        if not user_to_deactivate:
            return Response({"error":"There is no user with the given id!"},status=status.HTTP_404_NOT_FOUND)
        user_to_deactivate.is_active = False
        user_to_deactivate.save()
        return Response({"message":"user deactivated successfully"},status=status.HTTP_200_OK)

class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def activate_user(request,id):
    try:
        user = User.objects.get(pk=id)
    except:
        return Response({"error":"there is no user with the given id"},status=status.HTTP_404_NOT_FOUND)
    user.is_active = True
    user.save()
    return Response({"message":"user is activated successfully!"},status=status.HTTP_200_OK)

#-------------------------------------an API for assigning permissions to users, we can either remove or add permissions to users-----------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setUserPermissions(request):
    if not request.user.has_perm('pms.change_user'):
        return Response({"message":"you don't have the permission to set user's permissions"},status=status.HTTP_403_FORBIDDEN)
    user_id = request.data.get("user_id")
    permission_code_names = request.data.get("permissions") 
    if not user_id or not permission_code_names:
        return Response({"message":"please provide user_id and permissions"},status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"message":"user does not exist"},status=status.HTTP_404_NOT_FOUND)
    permissions = Permission.objects.filter(codename__in=permission_code_names)
    user.user_permissions.clear()
    user.user_permissions.set(permissions)
    return Response({"message":"permissions assigned to user succssfully!"},status=status.HTTP_200_OK)


#-------------------------------------an API for assigning groups to users, we can either remove or add groups to users-----------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setUserGroups(request):
    if (not request.user.has_perm('pms.change_user')) and (not request.user.has_perm('pms.change_customuser')):
        return Response({"message":"you don't have the permission to set user's groups"},status=status.HTTP_403_FORBIDDEN)
    user_id = request.data.get("user_id")
    group_names = request.data.get("groups") 
    if not user_id or not group_names:
        return Response({"message":"please provide user_id and permissions"},status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(id=user_id)
    except Group.DoesNotExist:
        return Response({"message":"User does not exist"},status=status.HTTP_404_NOT_FOUND)
    groups = Group.objects.filter(name__in=group_names)
    if not groups:
        return Response({"message":"group not found!"},status=status.HTTP_404_NOT_FOUND)
    user.groups.clear()
    user.groups.set(groups)
    return Response({"message":"groups assigned to user succssfully!"},status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def send_password_reset_email(request):
    email = request.data.get("email")
    if not email:
        return Response({"error":"please provide email!"},status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error":"there is no user with the provided email"},status=status.HTTP_404_NOT_FOUND)
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)

    current_site = get_current_site(request)
    dummy_site = "http://localhost:3000/en/reset-password?" + f'{token}'
    reset_link = f"https://{current_site.domain}/reset-password/{token}"
    
    # Correct HTML message body with proper structure
    html_message = f'''
    <html>
      <body>
        <p>Hello,</p>
        <p>Click this link {dummy_site} to reset your password.</p>
        <p>Best regards,<br>Phoenixopia PMS</p>
      </body>
    </html>
    '''
    
    # Send email with both plain text and HTML content
    send_mail(
        subject="Password reset request",
        message=f"Click the link below to reset your password:\n\n{dummy_site}",  # Plain text version
        html_message=html_message,  # HTML version
        from_email="ketsebaotertumo@gmail.com",
        recipient_list=[email],
        fail_silently=False
    )


    return Response({"message":"password reset email was sent successfully"},status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request,token):
    acces_token = AccessToken(token)
    try:
        user = User.objects.get(id=acces_token["user_id"])
    except User.DoesNotExist:
        return Response({"error":"Invalid or expired token"},status=status.HTTP_400_BAD_REQUEST)
    new_password = request.data.get("password")
    user.set_password(new_password)
    user.save()

    return Response({"message":"password reset successfully!"},status=status.HTTP_200_OK)
 

@api_view(["POST"])
@permission_classes([AllowAny])
def get_user_profile(request):
    access_token = AccessToken((request.data.get("access_token")))
    try:
        user = User.objects.get(id=access_token['user_id'])
    except User.DoesNotExist:
        return Response({"error": "Invalid or expired token"},status=status.HTTP_400_BAD_REQUEST)
    return Response({"user_id":user.pk,"first_name":user.first_name,"middle_name":user.middle_name,
                     "last_name":user.last_name,"email":user.email,"user_permissions":user.get_all_permissions(),
                     "groups":user.groups.values_list('name',flat=True),"profile_picture":user.profile_picture.url},status=status.HTTP_200_OK)



@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user(request,id):
    User = get_user_model()
    if not request.user.has_perm("change_user"):
        return Response({"message":"Unauthorized accesss!"},status=status.HTTP_401_UNAUTHORIZED)
    from django.core.exceptions import ObjectDoesNotExist

    try:
        user = User.objects.get(id=id)
    except ObjectDoesNotExist:
        return Response({"error":"user with the given id does not exist!"}, status=status.HTTP_404_NOT_FOUND)
    user_permissions = request.data.get("user_permissions",[])
    user_groups = request.data.get("groups",[])
    first_name = request.data.get("first_name")
    middle_name = request.data.get("middle_name")
    last_name = request.data.get("last_name")
    address = request.data.get("address")
    phone_number = request.data.get("phone_number")
    #is_active = request.data.get("is_get")
    is_superuser = request.data.get("is_superuser")
    profile_picture = request.FILES.get("profile_picture")
    is_active = request.data.get("is_active")
    
    if is_active is not None:
        user.is_active = is_active
    if user_permissions:
        permissions = Permission.objects.filter(codename__in=user_permissions)
        user.user_permissions.clear()
        user.user_permissions.set( permissions)
    if user_groups:
        groups = Group.objects.filter(name__in=user_groups)
        user.groups.clear()
        user.groups.set(groups)
    if first_name:
        user.first_name = first_name
    if middle_name:
        user.middle_name = middle_name
    if last_name:
        user.last_name = last_name
    if address:
        user.address = address
    if phone_number:
        user.phone_number = phone_number
    if is_superuser:
        user.is_superuser = is_superuser
    if profile_picture:
        user.profile_picture = profile_picture

    user.save()

    return Response({"message":"successfully updated user!"},status=status.HTTP_200_OK)





class GetTenats(generics.ListAPIView):
    queryset = User.objects.filter(groups__name="tenant")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated,DjangoModelPermissions]
    filter_backends = [OrderingFilter,SearchFilter]
    search_fields = [field.name for field in User._meta.fields]
    ordering_fields = [field.name for field in User._meta.fields]
    ordering = ['id']
    pagination_class = CustomPagination




@api_view()
@permission_classes([IsAuthenticated])
def get_owners(request):
    owners = User.objects.filter(groups__name="owner")
        
    # Concatenate first_name and middle_name (if middle_name exists) into one field
    owners_data = owners.annotate(full_name=Concat(F('first_name'), Value(' '), F('middle_name'),Value(' '),F('last_name'))).values("id", "full_name")
    
    # Return the response with the data
    return Response({"owners": owners_data}, status=status.HTTP_200_OK)
       
@api_view()
@permission_classes([IsAuthenticated])
def get_managers(request):
    managers = User.objects.filter(groups__name="manager")
        
    # Concatenate first_name and middle_name (if middle_name exists) into one field
    managers_data = managers.annotate(full_name=Concat(F('first_name'), Value(' '), F('middle_name'),Value(' '),F('last_name'))).values("id", "full_name")
    
    # Return the response with the data
    return Response({"managers": managers_data}, status=status.HTTP_200_OK)

@api_view()
@permission_classes([IsAuthenticated])
def get_tenants(request):
    tenants = User.objects.filter(groups__name="tenant")
        
    # Concatenate first_name and middle_name (if middle_name exists) into one field
    tenants_data = tenants.annotate(full_name=Concat(F('first_name'), Value(' '), F('middle_name'),Value(' '),F('last_name'))).values("id", "full_name")
    
    # Return the response with the data
    return Response({"tenants": tenants_data}, status=status.HTTP_200_OK)



# billing/views.py
from django.db import transaction
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.core.mail import send_mail
from django.conf import settings
from urllib.parse import urljoin

from ..models import User, CustomerBiller, EmailVerification, Biller
from ..serializers import UserSerializer


from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from urllib.parse import urljoin
from django.contrib.auth.models import Group

from ..models import CustomUser, CustomerBiller, Biller, EmailVerification
from ..serializers import UserSerializer


class CustomerRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    @swagger_auto_schema(
        operation_description="Register a new customer and link to one or more billers.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['email', 'password', 'first_name', 'last_name', 'biller_ids'],
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, example="customer@example.com"),
                'password': openapi.Schema(type=openapi.TYPE_STRING, example="strongpassword123"),
                'first_name': openapi.Schema(type=openapi.TYPE_STRING, example="John"),
                'middle_name': openapi.Schema(type=openapi.TYPE_STRING, example="M."),
                'last_name': openapi.Schema(type=openapi.TYPE_STRING, example="Doe"),
                'phone_number': openapi.Schema(type=openapi.TYPE_STRING, example="+251912345678"),
                'address': openapi.Schema(type=openapi.TYPE_STRING, example="Addis Ababa, Ethiopia"),
                'biller_ids': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Items(type=openapi.TYPE_INTEGER),
                    example=[1, 2, 3],
                    description="List of biller IDs the customer wants to register with."
                ),
            },
        ),
        responses={
            201: openapi.Response('Registration successful'),
            400: openapi.Response('Bad Request'),
            403: openapi.Response('Email already exists'),
        }
    )
    @transaction.atomic
    def post(self, request, *args, **kwargs):
        data = request.data

        if CustomUser.objects.filter(email=data.get("email")).exists():
            return Response(
                {"error": "This email already exists in the system"},
                status=status.HTTP_403_FORBIDDEN
            )

        user = CustomUser(
            email=data.get("email"),
            first_name=data.get("first_name"),
            middle_name=data.get("middle_name"),
            last_name=data.get("last_name"),
            phone_number=data.get("phone_number"),
            address=data.get("address"),
            is_customer=True,
            is_active=False  
        )
        user.set_password(data.get("password"))
        user.save()

        user.groups.set(Group.objects.filter(name="Customer"))

        biller_ids = data.get("biller_ids", [])
        created_links = []
        for biller_id in biller_ids:
            try:
                biller = Biller.objects.get(id=biller_id)
                CustomerBiller.objects.create(
                    user=user,
                    biller=biller,
                    address=data.get("address"),
                    phone_number=data.get("phone_number")
                )
                created_links.append(biller.name)
            except Biller.DoesNotExist:
                transaction.set_rollback(True)
                return Response(
                    {"error": f"Biller with id {biller_id} does not exist."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        verification = EmailVerification.objects.create(user=user)

        current_site = request.build_absolute_uri('/')
        mail_subject = 'Verify your email address'
        verify_link = f"api/verify-email/{verification.token}"
        absolute_url = urljoin(current_site, verify_link)
        message = (
            f"Hi {user.first_name or 'Customer'},\n\n"
            f"Please verify your email by clicking the link below:\n\n{absolute_url}\n\n"
            f"You are registering with the following billers: {', '.join(created_links)}"
        )
        send_mail(mail_subject, message, settings.EMAIL_HOST_USER, [user.email])

        return Response({
            "message": "Registration successful. Please check your email to verify your account.",
            "linked_billers": created_links,
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request, token):
    try:
        verification = EmailVerification.objects.get(token=token)
        user = verification.user
        if not user.is_active:
            user.is_active = True
            user.save()
            verification.delete()  
            send_mail("verification successful", "Your email has been successfully verified. You can now log in.", EMAIL_HOST_USER, [user.email])
            return Response({'message': 'Your email has been successfully verified. You can now log in.'}, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'Your email has already been verified.'}, status=status.HTTP_200_OK)
    except EmailVerification.DoesNotExist:
        return Response({'error': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)









@api_view(['POST'])
@permission_classes([AllowAny])
def contact_us(request):
    full_name = request.data.get('full_name')
    email = request.data.get('email')
    subject = request.data.get('subject')
    message = request.data.get('message')
    recepient_email = os.getenv('COMPANY_EMAIL')

    if not(full_name or email or subject or message or recepient_email):
        return Response({"error":"please provide all the fields needed"},status=status.HTTP_400_BAD_REQUEST)

    send_mail(subject=subject,message=message,from_email=email,recipient_list=['jni@gmail.com'])

    return Response({"success":"sent email successfully"},status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_customers(request):
        if not request.user.has_perm('view_user'):
            return Response({"message": "you don't have the permission to view users"}, status=status.HTTP_403_FORBIDDEN)

        customers = User.objects.filter(groups__name="Customer")
        paginator = CustomPagination()
        paginated_customers = paginator.paginate_queryset(customers, request)
        serializer = UserSerializer(paginated_customers, many=True)
        return paginator.get_paginated_response(serializer.data)



    