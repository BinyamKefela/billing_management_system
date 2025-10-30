from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from auditlog.models import LogEntry
from ..serializers import AuditLogSerializer

from drf_yasg.utils import swagger_auto_schema

class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    queryset = LogEntry.objects.all()

    @swagger_auto_schema(auto_schema=None)
    def get(self, *args, **kwargs):
        return super().get(*args, **kwargs)

