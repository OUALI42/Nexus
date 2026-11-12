from django.urls import path

from .views import (
    CompleteOnboardingView,
    CsrfTokenView,
    LoginView,
    LogoutView,
    PrivacyPolicyView,
    RegisterView,
    ResendVerificationView,
    SessionView,
    TrackListView,
    VerifyEmailView,
)

app_name = "accounts"

urlpatterns = [
    path("csrf/", CsrfTokenView.as_view(), name="csrf"),
    path("register/", RegisterView.as_view(), name="register"),
    path("tracks/", TrackListView.as_view(), name="tracks"),
    path("privacy-policy/", PrivacyPolicyView.as_view(), name="privacy-policy"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path(
        "resend-verification/",
        ResendVerificationView.as_view(),
        name="resend-verification",
    ),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("session/", SessionView.as_view(), name="session"),
    path(
        "onboarding/complete/",
        CompleteOnboardingView.as_view(),
        name="onboarding-complete",
    ),
]
