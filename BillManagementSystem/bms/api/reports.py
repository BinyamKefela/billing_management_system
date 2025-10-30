from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..models import Bill, Payment, PaymentBill, CustomerBiller


def total_spending(user):
    """Total amount the customer has paid (across all bills)."""
    return PaymentBill.objects.filter(
        payment__customer=user
    ).aggregate(total_spent=Sum('amount_applied'))


def spending_by_biller(user):
    """Spending per biller (sum of applied amounts)."""
    return (
        PaymentBill.objects.filter(payment__customer=user)
        .values('bill__biller__company_name')
        .annotate(total=Sum('amount_applied'))
        .order_by('-total')
    )


def monthly_spending(user):
    """Total amount paid per month."""
    return (
        PaymentBill.objects.filter(payment__customer=user)
        .annotate(month=TruncMonth('payment__payment_date'))
        .values('month')
        .annotate(total=Sum('amount_applied'))
        .order_by('month')
    )


def outstanding_payments(user):
    """Outstanding (unpaid) bills summary for the customer."""
    today = timezone.now().date()
    total_due = (
        Bill.objects.filter(customer=user, status='pending')
        .aggregate(total_due=Sum('amount'))['total_due'] or 0
    )

    overdue_count = (
        Bill.objects.filter(customer=user, status='pending', due_date__lt=today)
        .count()
    )

    return {'total_due': total_due, 'overdue_count': overdue_count}

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
            if item['month']:
                item['month'] = item['month'].strftime('%Y-%m')
        return Response(data)


class OutstandingPaymentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = outstanding_payments(request.user)
        return Response(data)


#-----for biller--------------


def biller_total_revenue(biller):
    """Total revenue collected by the biller."""
    return (
        PaymentBill.objects.filter(bill__biller=biller)
        .aggregate(total_revenue=Sum('amount_applied'))
    )


def biller_revenue_by_customer(biller):
    """Revenue breakdown by customer (based on PaymentBill)."""
    return (
        PaymentBill.objects.filter(bill__biller=biller)
        .values(
            'payment__customer__email',
            'payment__customer__first_name',
            'payment__customer__last_name'
        )
        .annotate(total_paid=Sum('amount_applied'))
        .order_by('-total_paid')
    )


def biller_monthly_revenue(biller):
    """Monthly revenue trend for this biller."""
    return (
        PaymentBill.objects.filter(bill__biller=biller)
        .annotate(month=TruncMonth('payment__payment_date'))
        .values('month')
        .annotate(total_revenue=Sum('amount_applied'))
        .order_by('month')
    )


def biller_outstanding_invoices(biller):
    """Outstanding invoices summary for this biller."""
    today = timezone.now().date()

    total_outstanding = (
        Bill.objects.filter(biller=biller, status__in=['pending', 'overdue'])
        .aggregate(total_outstanding=Sum('amount'))['total_outstanding'] or 0
    )

    overdue_invoices = (
        Bill.objects.filter(biller=biller, status='overdue', due_date__lt=today)
        .count()
    )

    pending_invoices = (
        Bill.objects.filter(biller=biller, status='pending')
        .count()
    )

    return {
        'total_outstanding': total_outstanding,
        'overdue_invoices': overdue_invoices,
        'pending_invoices': pending_invoices,
        'total_unpaid_invoices': overdue_invoices + pending_invoices
    }


def biller_customer_statistics(biller):
    total_customers = CustomerBiller.objects.filter(biller=biller).count()

    active_customers = (
        CustomerBiller.objects.filter(
            biller=biller,
            user__bills__status__in=['pending', 'overdue']
        )
        .distinct()
        .count()
    )

    return {
        'total_customers': total_customers,
        'active_customers': active_customers,
        'inactive_customers': total_customers - active_customers,
    }


def biller_payment_methods(biller):
    return (
        PaymentBill.objects.filter(bill__biller=biller)
        .values('payment__payment_method')
        .annotate(
            total_amount=Sum('amount_applied'),
            payment_count=Count('payment', distinct=True)
        )
        .order_by('-total_amount')
    )


class BillerTotalRevenueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        biller = getattr(request.user, 'biller_profile', None)
        if not biller:
            return Response({"error": "User is not a biller"}, status=403)

        total = biller_total_revenue(biller)['total_revenue'] or 0
        return Response({"total_revenue": total})


class BillerRevenueByCustomerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        biller = getattr(request.user, 'biller_profile', None)
        if not biller:
            return Response({"error": "User is not a biller"}, status=403)

        data = list(biller_revenue_by_customer(biller))
        return Response(data)


class BillerMonthlyRevenueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        biller = getattr(request.user, 'biller_profile', None)
        if not biller:
            return Response({"error": "User is not a biller"}, status=403)

        data = list(biller_monthly_revenue(biller))
        for item in data:
            if item['month']:
                item['month'] = item['month'].strftime('%Y-%m')
        return Response(data)


class BillerOutstandingInvoicesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        biller = getattr(request.user, 'biller_profile', None)
        if not biller:
            return Response({"error": "User is not a biller"}, status=403)

        data = biller_outstanding_invoices(biller)
        return Response(data)


class BillerCustomerStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        biller = getattr(request.user, 'biller_profile', None)
        if not biller:
            return Response({"error": "User is not a biller"}, status=403)

        data = biller_customer_statistics(biller)
        return Response(data)


class BillerPaymentMethodsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        biller = getattr(request.user, 'biller_profile', None)
        if not biller:
            return Response({"error": "User is not a biller"}, status=403)

        data = list(biller_payment_methods(biller))
        return Response(data)
