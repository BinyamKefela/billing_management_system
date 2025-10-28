from rest_framework.views import exception_handler
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError


def custom_exception_handler(exc, context):
    """
    Convert Django ValidationError (from signals/models) into DRF ValidationError
    so DRF can return a proper JSON response instead of 500.
    """
    if isinstance(exc, DjangoValidationError):
        # Wrap into DRF ValidationError
        exc = DRFValidationError({"error": exc.messages[0]})

    # Let DRF handle the rest
    response = exception_handler(exc, context)

    return response
