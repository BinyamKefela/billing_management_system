from django.contrib import admin
from django.urls import path,include
from rest_framework_simplejwt.views import (TokenObtainPairView,TokenRefreshView,TokenVerifyView)

from bms.api.notification import NotificationCreateView

from .api.user import *
from .api.group import *
from .api.permission import *
from .api.biller import *
from .api.customerBiller import *
from .api.bill import *
from .api.payment import *
from .api.notification import *
from .api.reports import *



urlpatterns = [
  #--------------------------------users routes-----------------------------------------------
  path("get_users", UserListView.as_view(), name="get_users"),
  path("get_user/<int:id>",UserRetrieveView.as_view(),name='get_user'),
  path("post_user",UserCreateView.as_view(),name="post_user"),
  path("old_update_user/<int:id>",UserUpdateView.as_view(),name="update_user"),
  path("deactivate_user/<int:id>",UserDestroyView.as_view(),name="delete_user"),
  path("set_user_permissions",setUserPermissions,name="set_user_permissions"),
  path("set_user_groups", setUserGroups, name="set_user_group"),
  path("send_password_reset_email",send_password_reset_email,name="send_password_reset_email"),
  path("reset_password/<str:token>",reset_password,name="reset_passord"),
  path("get_user_profile",get_user_profile,name="get_user_id"),
  path("update_user/<int:id>",update_user,name="new_update_user"),
  path("activate_user/<int:id>", activate_user, name="activate_user"),
  path("get_owners",get_owners,name="get_owners"),
  path("get_managers",get_managers,name="get_managers"),
  path("get_tenants",GetTenats.as_view(),name="get_tenants"),
  path('sign_up',CustomerRegistrationView.as_view(), name='sign_up'),
  path('get_cutomers', get_customers, name='get_customers'),

  #path('register',sign_up_zone_owner, name='register'),
  path('verify-email/<uuid:token>', verify_email, name='verify_email'),

  #path('send_password_reset_email_phone',send_password_reset_email_phone, name='send_password_reset_email_phone'),
  #path('verify_reset_code', VerifyResetCodeView.as_view(), name='verify_reset_code'),
  #path('reset_password_phone',reset_password_phone,name='reset_password_phone'),

  #path("change_password",change_password,name="change_password"),




  
  

  



    #--------------------------------Groups routes----------------------------------------------
  path("get_groups", GroupListView.as_view(), name="get_groups"),
  path("get_group/<int:id>",GroupRetrieveView.as_view(),name='get_group'),
  path("post_group",GroupCreateView.as_view(),name="post_group"),
  path("update_group/<int:id>",GroupUpdateView.as_view(),name="update_group"),
  path("delete_group/<int:id>",GroupDestroyView.as_view(),name="delete_group"),
  path("set_group_permissions",setGroupPermissions,name="set_group_permissions"),
  path("get_group_permissions",getGroupPermission,name="get_group_permissions"),



    #--------------------------------Permission routes--------------------------------------------
  path("get_permissions", PermissionListView.as_view(), name="get_permissions"),
  path("get_permission/<int:id>",PermissionRetrieveView.as_view(),name='get_permission'),
  path("post_permission",PermissionCreateView.as_view(),name="post_permission"),
  path("update_permission/<int:id>",PermissionUpdateView.as_view(),name="update_permission"),
  path("delete_permission/<int:id>",PermissionDestroyView.as_view(),name="delete_permission"),




  #-------------------------biller routes----------------------------------

  path('get_billers', BillerListView.as_view(), name='biller-list'),
    path('post_biller', BillerRegistrationView.as_view(), name='biller-create'),
    path('get_biller/<int:pk>/',BillerRetrieveView.as_view(), name='biller-retrieve'),
    path('update_biller/<int:pk>',BillerUpdateView.as_view(), name='biller-update'),
    path('delete_biller/<int:pk>', BillerDeleteView.as_view(), name='biller-delete'),
    
    #---------------------customer_biller routes------------------------------------
    path('get_customer_billers', CustomerBillerListView.as_view(), name='customer-biller-list'),
    path('post_customer_biller', CustomerBillerCreateView.as_view(), name='customer-biller-create'),
    path('get_customer_biller/<int:pk>/',CustomerBillerRetrieveView.as_view(), name='customer-biller-retrieve'),
    path('update_customer_biller/<int:pk>',CustomerBillerUpdateView.as_view(), name='customer-biller-update'),
    path('delete_customer_biller/<int:pk>', CustomerBillerDeleteView.as_view(), name='customer-biller-delete'),
    
    #---------------------Bill routes------------------------------------
    path('get_bills', BillListView.as_view(), name='bill-list'),
    path('post_bill', BillCreateView.as_view(), name='bill-create'),
    path('get_bill/<int:pk>/', BillRetrieveView.as_view(), name='bill-retrieve'),
    path('update_bill/<int:pk>', BillUpdateView.as_view(), name='bill-update'),
    path('delete_bill/<int:pk>', BillDeleteView.as_view(), name='bill-delete'),
    
    #---------------------payment routes------------------------------------
    path('get_payments', PaymentListView.as_view(), name='payment-list'),
    path('post_payment', PaymentCreateView.as_view(), name='payment-create'),
    path('get_payment/<int:pk>/', PaymentRetrieveView.as_view(), name='payment-retrieve'),
    path('update_payment/<int:pk>', PaymentUpdateView.as_view(), name='payment-update'),
    path('delete_payment/<int:pk>', PaymentDeleteView.as_view(), name='payment-delete'),
    
    
    #------------------------Notifications routes----------------------------------------
    path('get_notifications', NotificationListView.as_view(), name='notification-list'),
    path('post_notification', NotificationCreateView.as_view(), name='notification-create'),
    path('get_notification/<int:pk>/', NotificationRetrieveView.as_view(), name='notification-retrieve'),
    path('update_notification/<int:pk>', NotificationUpdateView.as_view(), name='notification-update'),
    path('delete_notification/<int:pk>', NotificationDeleteView.as_view(), name='notification-delete'),
    
    
    #---------------------reports routes-----------------------------------
    
    path('total_spending', TotalSpendingView.as_view(), name='total_spending'),
    path('spending_by_biller', SpendingByBillerView.as_view(), name='spending_by_biller'),
    path('monthly_spending', MonthlySpendingView.as_view(), name='monthly_spending'),
    path('outstanding_payments', OutstandingPaymentsView.as_view(), name='outstanding_payments'),
    
    
    #-------------------biller reports routes--------------------------------
    
    path('biller/total_revenue', BillerTotalRevenueView.as_view(), name='biller_total_revenue'),
    path('biller/revenue_by_customer', BillerRevenueByCustomerView.as_view(), name='biller_revenue_by_customer'),
    path('biller/monthly_revenue', BillerMonthlyRevenueView.as_view(), name='biller_monthly_revenue'),
    path('biller/outstanding_invoices', BillerOutstandingInvoicesView.as_view(), name='biller_outstanding_invoices'),
    path('biller/customer_statistics', BillerCustomerStatisticsView.as_view(), name='biller_customer_statistics'),
    path('biller/payment_methods', BillerPaymentMethodsView.as_view(), name='biller_payment_methods'),
    
    
]


 