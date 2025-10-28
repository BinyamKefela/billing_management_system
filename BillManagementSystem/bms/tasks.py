from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from .models import Bill

@shared_task
def check_overdue_bills():
    today = timezone.now().date()
    overdue_bills = Bill.objects.filter(status='unpaid', due_date__lt=today)

    for bill in overdue_bills:
        bill.status = 'overdue'
        bill.save()

        
        customer_email = bill.customer.user.email
        subject = f"Overdue Bill - {bill.bill_number}"
        message = f"""
Dear {bill.customer.user.username},

Your bill with number {bill.bill_number} was due on {bill.due_date}.
Please make payment as soon as possible to avoid penalties.

Best regards,
Billing Team
"""
        send_mail(
            subject,
            message,
            'no-reply@billing.com',
            [customer_email],
            fail_silently=True,
        )

    return f"Marked {overdue_bills.count()} bills as overdue."
