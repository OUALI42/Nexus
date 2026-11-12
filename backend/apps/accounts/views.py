from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.core.mixins import CsrfProtectedMixin

from .selectors import session_payload
from .serializers import (
    LoginSerializer,
    PrivacyPolicySerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
    SessionSerializer,
    TrackGroupSerializer,
    VerifyEmailSerializer,
)
from .services import (
    complete_onboarding,
    log_in,
    log_out,
    resend_email_verification,
    verify_email,
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


class VerifyEmailView(CsrfProtectedMixin, APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        request=VerifyEmailSerializer,
        responses={204: None},
        summary="Verify an email address with a single-use token",
    )
    def post(self, request: Request) -> Response:
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verify_email(serializer.validated_data["token"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResendVerificationView(CsrfProtectedMixin, APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        request=ResendVerificationSerializer,
        responses={202: None},
        summary="Send a new verification link (same answer for any address)",
    )
    def post(self, request: Request) -> Response:
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resend_email_verification(serializer.validated_data["email"])
        return Response(status=status.HTTP_202_ACCEPTED)


class LoginView(CsrfProtectedMixin, APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        request=LoginSerializer,
        responses={200: SessionSerializer},
        summary="Log in (session cookie)",
    )
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Django's HttpRequest, not DRF's wrapper: axes and login() need it.
        user = log_in(request._request, **serializer.validated_data)
        return Response(session_payload(user))


class LogoutView(CsrfProtectedMixin, APIView):
    permission_classes = [AllowAny]  # logging out twice is harmless

    @extend_schema(request=None, responses={204: None}, summary="Log out")
    def post(self, request: Request) -> Response:
        log_out(request._request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class SessionView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses={200: SessionSerializer}, summary="Current session")
    def get(self, request: Request) -> Response:
        return Response(session_payload(request.user))


class CompleteOnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={204: None}, summary="Finish onboarding")
    def post(self, request: Request) -> Response:
        complete_onboarding(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
