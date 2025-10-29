from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from .models import Bill, Notification

@shared_task
def send_due_notifications():
    today = timezone.now().date()
    tomorrow = today + timedelta(days=1)

    # Overdue bills
    overdue_bills = Bill.objects.filter(status='pending', due_date__lt=today)
    for bill in overdue_bills:
        _create_and_send_notification(
            bill,
            notif_type='overdue',
            subject=f"Overdue Bill #{bill.bill_number}",
            message=f"Dear {bill.customer.first_name or 'Customer'},\n\n"
                    f"Your payment for bill #{bill.bill_number} (amount: {bill.amount} ETB) "
                    f"was due on {bill.due_date}. Please make the payment as soon as possible."
        )
        bill.status = 'overdue'
        bill.save()

    # Upcoming (1 day left) bills
    upcoming_bills = Bill.objects.filter(status='pending', due_date=tomorrow)
    for bill in upcoming_bills:
        _create_and_send_notification(
            bill,
            notif_type='upcoming_due',
            subject=f"Reminder: Bill #{bill.bill_number} is due tomorrow!",
            message=f"Dear {bill.customer.first_name or 'Customer'},\n\n"
                    f"Your bill #{bill.bill_number} for {bill.amount} ETB is due tomorrow ({bill.due_date})."
        )

def _create_and_send_notification(bill, notif_type, subject, message):
    try:
        # Create Notification
        if Notification.objects.filter(
            bill=bill,
            notification_type=notif_type,
            status='sent'
        ).exists():
            return  
        Notification.objects.create(
            bill=bill,
            customer=bill.customer,
            notification_type=notif_type,
            subject=subject,
            message=message,
            sent_via='email',
            status='sent',
            sent_at=timezone.now(),
        )

        # Send email
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [bill.customer.email],
            fail_silently=False,
        )

    except Exception as e:
        Notification.objects.create(
            bill=bill,
            customer=bill.customer,
            notification_type=notif_type,
            subject=subject,
            message=message,
            sent_via='email',
            status='failed',
            error_message=str(e),
        )
