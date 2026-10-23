from django.db import connection
from django.http import JsonResponse
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
    throttle_classes,
)
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@extend_schema(
    tags=["system"],
    summary="Health check",
    responses=inline_serializer(
        name="HealthResponse",
        fields={"status": serializers.CharField(), "database": serializers.CharField()},
    ),
)
@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([])
def health(request):
    try:
        connection.ensure_connection()
        database = "ok"
    except Exception:  # noqa: BLE001 - any DB failure means "down"
        database = "down"
    http_status = status.HTTP_200_OK if database == "ok" else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response({"status": "ok" if database == "ok" else "degraded", "database": database}, status=http_status)


def _json_error(code: str, message: str, http_status: int) -> JsonResponse:
    return JsonResponse({"error": {"code": code, "message": message, "details": {}}}, status=http_status)


def not_found(request, exception=None):
    """Used for unknown URLs (outside DRF views) when DEBUG is False."""
    return _json_error("not_found", "Ressource introuvable.", 404)


def server_error(request):
    return _json_error("server_error", "Une erreur interne est survenue.", 500)
