from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User,Group,Permission,ContentType
from django.contrib.auth import get_user_model,authenticate
from rest_framework import serializers
from .models import *

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    username_field = "email"
    
    def validate(self, attrs):
        credentials={
            "email":attrs.get("email"),
            "password":attrs.get("password")
        }
    
        data = super().validate(attrs)
        user = authenticate(email=attrs['email'],password=attrs['password'])
        if user and not user.is_active:
            raise serializers.ValidationError({"error":"user is banned from the system"})
           
    

        user = authenticate(**credentials)
        
        if user is None:
            raise serializers.ValidationError({"error":"invalid credentials"})
        
        #lets add permissions to the token payload
        #permissions = user.get_all_permissions()
        data = super().validate(attrs)
        data['permissions'] = list(user.get_all_permissions())
        data['groups'] = list(user.groups.values_list('name',flat=True))
        data['email'] = user.email
        data['id'] = user.id
        data['is_superuser'] = user.is_superuser
        data['is_staff'] = user.is_staff
        data['is_biller'] = user.is_biller
        data['is_customer'] = user.is_customer
        data['first_name'] = user.first_name
        data['last_name'] = user.last_name
        data['profile_picture'] = user.profile_picture.url if user.profile_picture else None
        return data
    
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    user_permissions = serializers.SlugRelatedField(slug_field="codename",queryset=Permission.objects.all(),many=True,required=False)
    groups = serializers.SlugRelatedField(slug_field="name",queryset=Group.objects.all(),many=True,required=False)
    class Meta:
        model = User
        fields = "__all__"

    def validate(self, data):
        if self.instance is None and "password" not in data:
            raise serializers.ValidationError({"password":"This field is required when creating a new user!"})
        return data

    def create(self, validated_data):
        password = validated_data.pop("password",None)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop("password",None)
        for attr,value in validated_data.items():
            setattr(instance,attr,value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
    
    def to_representation(self, instance):
        """Ensure superusers receive all permissions."""
        representation = super().to_representation(instance)

        if instance.is_superuser:
            # Get all permission codenames for superusers
            all_permissions = Permission.objects.values_list("codename", flat=True)
            representation["user_permissions"] = list(all_permissions)
        else:
            # Regular users: only show explicitly assigned permissions
            representation["user_permissions"] = list(instance.user_permissions.values_list("codename", flat=True))
        return representation
    
class GroupSerializer(serializers.ModelSerializer):
    permissions = serializers.SlugRelatedField(slug_field="codename",queryset=Permission.objects.all(),many=True,required=False)

    class Meta:
        model = Group
        fields = "__all__"


class PermissionSerializer(serializers.ModelSerializer):
    content_type = serializers.PrimaryKeyRelatedField(write_only=True,queryset=ContentType.objects.all())
    class Meta:
        model = Permission
        fields = "__all__"



class BillerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Biller
        fields = '__all__'
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['user'] = UserSerializer(instance.user).data
        return representation
        

        
        
class CustomerBillerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerBiller
        fields = "__all__"
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['user'] = UserSerializer(instance.user).data
        representation['biller'] = BillerSerializer(instance.biller).data
        return representation
    

class BillSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Bill
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['biller'] = BillerSerializer(instance.biller).data
        representation['customer'] = UserSerializer(instance.customer).data
        return representation
    

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['customer'] = UserSerializer(instance.customer).data
        representation['payment_bills'] = PaymentBillDemoSerializer(instance.payment_bills.filter(payment=instance), many=True).data
        representation['bills'] = BillSerializer(instance.bills, many=True).data
        return representation
    
    


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['bill'] = BillSerializer(instance.bill).data
        representation['customer'] = UserSerializer(instance.customer).data
        return representation
    
class PaymentBillSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentBill
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['payment'] = PaymentSerializer(instance.payment).data
        representation['bill'] = BillSerializer(instance.bill).data
        return representation

class PaymentBillDemoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentBill
        fields = '__all__'
        
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        #representation['payment'] = PaymentSerializer(instance.payment).data
        representation['bill'] = BillSerializer(instance.bill).data
        return representation
    
    



