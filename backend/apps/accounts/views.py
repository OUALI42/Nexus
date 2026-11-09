from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from rest_framework.throttling import ScopedRateThrottle
from apps.core.mixins import CsrfProtectedMixin
from .serializers import (
    PrivacyPolicySerializer,
    RegisterSerializer,
    TrackGroupSerializer,
)
from .tracks import TRACK_GROUPS


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfTokenView(APIView):
    """Sets the csrftoken cookie so the SPA can send X-CSRFToken."""

    permission_classes = [AllowAny]

    @extend_schema(responses={204: None}, summary="Initialize the CSRF cookie")
    def get(self, request: Request) -> Response:
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterView(CsrfProtectedMixin, APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        request=RegisterSerializer,
        responses={201: RegisterSerializer},
        summary="Create an account",
    )
    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TrackListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: TrackGroupSerializer(many=True)},
        summary="List tracks, grouped",
    )
    def get(self, request: Request) -> Response:
        groups = [
            {
                "label": label,
                "options": [{"value": t.value, "label": t.label} for t in tracks],
            }
            for label, tracks in TRACK_GROUPS.items()
        ]
        return Response(groups)


class PrivacyPolicyView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        responses={200: PrivacyPolicySerializer},
        summary="Current privacy policy version",
    )
    def get(self, request: Request) -> Response:
        return Response({"version": settings.PRIVACY_POLICY_VERSION})
