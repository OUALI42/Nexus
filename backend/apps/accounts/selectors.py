from django.conf import settings

from apps.billing.models import Subscription

from .models import Profile


def session_payload(user) -> dict:
    """What the front-end needs to know about the current session."""
    payload = {
        "authenticated": user.is_authenticated,
        "user": None,
        "idle_timeout": settings.SESSION_IDLE_TIMEOUT,
        "idle_warning": settings.SESSION_IDLE_WARNING,
    }
    if not user.is_authenticated:
        return payload

    profile = Profile.objects.filter(user=user).first()
    subscription = Subscription.objects.select_related("plan").filter(user=user).first()
    payload["user"] = {
        "email": user.email,
        "username": profile.username if profile else None,
        "track": profile.track if profile else None,
        "plan": (
            {"code": subscription.plan.code, "name": subscription.plan.name}
            if subscription
            else None
        ),
        # Accounts created before S4 have no profile: onboarding creates it later.
        "needs_onboarding": profile is None or profile.onboarding_completed_at is None,
    }
    return payload
