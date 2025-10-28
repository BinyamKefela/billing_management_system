from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..models import Bill, Payment, CustomerBiller


def total_spending(user):
    return Payment.objects.filter(
        customer=user
    ).aggregate(total_spent=Sum('amount'))


def spending_by_biller(user):
    return Payment.objects.filter(
        customer=user
    ).values('bill__biller__name').annotate(total=Sum('amount')).order_by('-total')


def monthly_spending(user):
    return Payment.objects.filter(
        customer=user
    ).annotate(month=TruncMonth('payment_date')).values('month').annotate(total=Sum('amount')).order_by('month')


def outstanding_payments(user):
    today = timezone.now().date()
    total_due = Bill.objects.filter(
        customer=user,
        status='unpaid'
    ).aggregate(total_due=Sum('amount'))['total_due'] or 0

    overdue_count = Bill.objects.filter(
        customer=user,
        status='unpaid',
        due_date__lt=today
    ).count()

    return {
        'total_due': total_due,
        'overdue_count': overdue_count
    }


class TotalSpendingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total = total_spending(request.user)['total_spent'] or 0
        return Response({"total_spent": total})


class SpendingByBillerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = list(spending_by_biller(request.user))
        return Response(data)


class MonthlySpendingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = list(monthly_spending(request.user))
        for item in data:
            item['month'] = item['month'].strftime('%Y-%m')
        return Response(data)


class OutstandingPaymentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = outstanding_payments(request.user)
        return Response(data)
    
    
    
    

#---biller reports ------

from django.db.models import Count, Q
from django.utils import timezone

def biller_total_revenue(biller):
    """Total revenue collected by the biller"""
    return Payment.objects.filter(
        bill__biller=biller
    ).aggregate(total_revenue=Sum('amount'))

def biller_revenue_by_customer(biller):
    """Revenue breakdown by customer"""
    return Payment.objects.filter(
        bill__biller=biller
    ).values('customer__email', 'customer__first_name', 'customer__last_name').annotate(
        total_paid=Sum('amount')
    ).order_by('-total_paid')

def biller_monthly_revenue(biller):
    """Monthly revenue trend"""
    return Payment.objects.filter(
        bill__biller=biller
    ).annotate(month=TruncMonth('payment_date')).values('month').annotate(
        total_revenue=Sum('amount')
    ).order_by('month')

def biller_outstanding_invoices(biller):
    """Outstanding invoices summary"""
    today = timezone.now().date()
    
    total_outstanding = Bill.objects.filter(
        biller=biller,
        status__in=['pending', 'overdue']
    ).aggregate(total_outstanding=Sum('amount'))['total_outstanding'] or 0

    overdue_invoices = Bill.objects.filter(
        biller=biller,
        status='overdue',
        due_date__lt=today
    ).count()

    pending_invoices = Bill.objects.filter(
        biller=biller,
        status='pending'
    ).count()

    return {
        'total_outstanding': total_outstanding,
        'overdue_invoices': overdue_invoices,
        'pending_invoices': pending_invoices,
        'total_unpaid_invoices': overdue_invoices + pending_invoices
    }

def biller_customer_statistics(biller):
    """Customer statistics for the biller"""
    total_customers = CustomerBiller.objects.filter(biller=biller).count()
    
    active_customers = CustomerBiller.objects.filter(
        biller=biller,
        user__bills__status__in=['pending', 'overdue']
    ).distinct().count()

    return {
        'total_customers': total_customers,
        'active_customers': active_customers,
        'inactive_customers': total_customers - active_customers
    }

def biller_payment_methods(biller):
    """Payment method distribution"""
    return Payment.objects.filter(
        bill__biller=biller
    ).values('payment_method').annotate(
        total_amount=Sum('amount'),
        payment_count=Count('id')
    ).order_by('-total_amount')
    
    
    
# Add these to your views.py
class BillerTotalRevenueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'biller_profile'):
            return Response({"error": "User is not a biller"}, status=status.HTTP_403_FORBIDDEN)
        
        total = biller_total_revenue(request.user.biller_profile)['total_revenue'] or 0
        return Response({"total_revenue": total})

class BillerRevenueByCustomerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'biller_profile'):
            return Response({"error": "User is not a biller"}, status=status.HTTP_403_FORBIDDEN)
        
        data = list(biller_revenue_by_customer(request.user.biller_profile))
        return Response(data)

class BillerMonthlyRevenueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'biller_profile'):
            return Response({"error": "User is not a biller"}, status=status.HTTP_403_FORBIDDEN)
        
        data = list(biller_monthly_revenue(request.user.biller_profile))
        for item in data:
            item['month'] = item['month'].strftime('%Y-%m')
        return Response(data)

class BillerOutstandingInvoicesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'biller_profile'):
            return Response({"error": "User is not a biller"}, status=status.HTTP_403_FORBIDDEN)
        
        data = biller_outstanding_invoices(request.user.biller_profile)
        return Response(data)

class BillerCustomerStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'biller_profile'):
            return Response({"error": "User is not a biller"}, status=status.HTTP_403_FORBIDDEN)
        
        data = biller_customer_statistics(request.user.biller_profile)
        return Response(data)

class BillerPaymentMethodsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not hasattr(request.user, 'biller_profile'):
            return Response({"error": "User is not a biller"}, status=status.HTTP_403_FORBIDDEN)
        
        data = list(biller_payment_methods(request.user.biller_profile))
        return Response(data)