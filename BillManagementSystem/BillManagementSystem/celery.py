import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BillManagementSystem.settings')

app = Celery('BillManagementSystem')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'send-due-notifications-every-day': {
        'task': 'bms.tasks.send_due_notifications',
        'schedule': 60,#crontab(hour=6, minute=0)
    },
}
