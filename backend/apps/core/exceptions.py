"""Single error format for the whole API (ADR-009).

{"error": {"code": "...", "message": "...", "details": {...}}}
"""

import logging
import math

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.serializers import as_serializer_error
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class QuotaExceeded(exceptions.PermissionDenied):
    default_code = "quota_exceeded"
    default_detail = "Vous avez atteint la limite de votre offre."

    def __init__(self, resource: str, used: int, limit: int):
        super().__init__()
        self.extra = {"resource": resource, "used": used, "limit": limit}


class Conflict(exceptions.APIException):
    status_code = status.HTTP_409_CONFLICT
    default_code = "conflict"
    default_detail = "Cette ressource existe déjà."


class FileTooLarge(exceptions.APIException):
    status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    default_code = "file_too_large"
    default_detail = "Le fichier dépasse la taille autorisée par votre offre."


# Third-party codes mapped to our public codes
CODE_ALIASES = {
    "token_not_valid": "authentication_failed",
    "user_not_found": "authentication_failed",
    "user_inactive": "authentication_failed",
    "error": "server_error",
}

VALIDATION_MESSAGE = "Les données envoyées sont invalides."
SERVER_ERROR_MESSAGE = "Une erreur interne est survenue."


def _build(code: str, message: str, details: dict | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details or {}}}


def api_exception_handler(exc, context):
    # Convert Django exceptions so they get the same treatment as DRF ones.
    if isinstance(exc, DjangoValidationError):
        exc = exceptions.ValidationError(detail=as_serializer_error(exc))
    elif isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, DjangoPermissionDenied):
        exc = exceptions.PermissionDenied()

    response = exception_handler(exc, context)

    if response is None:
        # Unexpected error: log the traceback, never expose it to the client.
        logger.exception("Unhandled API error", exc_info=exc)
        return Response(
            _build("server_error", SERVER_ERROR_MESSAGE),
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, exceptions.ValidationError):
        details = response.data
        if not isinstance(details, dict):
            details = {"non_field_errors": details}
        response.data = _build("validation_error", VALIDATION_MESSAGE, details)
        return response

    codes = exc.get_codes()
    code = codes if isinstance(codes, str) else exc.default_code
    code = CODE_ALIASES.get(code, code)

    message = exc.detail if isinstance(exc.detail, str) else exc.default_detail
    details = dict(getattr(exc, "extra", {}))
    if isinstance(exc, exceptions.Throttled) and exc.wait is not None:
        details["retry_after"] = math.ceil(exc.wait)

    response.data = _build(code, str(message), details)
    return response
