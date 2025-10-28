from django.contrib import admin
from .models import *


admin.site.register(CustomUser)
admin.site.register(Notification)
admin.site.register(Biller)
admin.site.register(CustomerBiller)
admin.site.register(Payment)
admin.site.register(Bill)
