from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils.timezone import now

from .exceptions import (
    ExpiredVerificationToken,
    InvalidVerificationToken,
    UsedVerificationToken,
)
from .models import EmailVerificationToken, PrivacyConsent, Profile, User
from .tokens import generate_token, hash_token


@transaction.atomic
def register_user(
    *,
    email: str,
    password: str,
    username: str,
    track: str,
    policy_version: str,
) -> User:
    """Creates the account, its profile and the privacy consent together."""
    user = User.objects.create_user(email=email, password=password)
    Profile.objects.create(user=user, username=username, track=track)
    PrivacyConsent.objects.create(user=user, policy_version=policy_version)
    start_email_verification(user)
    return user


def start_email_verification(user: User) -> None:
    """Issues a token now; sends the email only once the transaction commits."""
    raw_token = _issue_verification_token(user)
    transaction.on_commit(lambda: _send_verification_email(user, raw_token))


def _issue_verification_token(user: User) -> str:
    # Only the latest link works: older unused tokens are revoked.
    EmailVerificationToken.objects.filter(user=user, used_at__isnull=True).delete()
    raw_token = generate_token()
    EmailVerificationToken.objects.create(
        user=user,
        token_hash=hash_token(raw_token),
        expires_at=now() + settings.EMAIL_VERIFICATION_TOKEN_TTL,
    )
    return raw_token


def _send_verification_email(user: User, raw_token: str) -> None:
    link = f"{settings.FRONTEND_URL}/verifier-email?{urlencode({'token': raw_token})}"
    ttl_hours = int(settings.EMAIL_VERIFICATION_TOKEN_TTL.total_seconds() // 3600)
    context = {"username": user.profile.username, "link": link, "ttl_hours": ttl_hours}

    message = EmailMultiAlternatives(
        subject="Confirme ton adresse e-mail Nexus",
        body=render_to_string("accounts/emails/verify_email.txt", context),
        to=[user.email],
    )
    message.attach_alternative(
        render_to_string("accounts/emails/verify_email.html", context), "text/html"
    )
    message.send()


@transaction.atomic
def verify_email(raw_token: str) -> User:
    token = (
        EmailVerificationToken.objects.select_for_update()
        .select_related("user")
        .filter(token_hash=hash_token(raw_token))
        .first()
    )
    if token is None:
        raise InvalidVerificationToken()
    if token.used_at is not None:
        raise UsedVerificationToken()
    if token.is_expired:
        raise ExpiredVerificationToken()

    token.used_at = now()
    token.save(update_fields=["used_at"])

    user = token.user
    user.is_email_verified = True
    user.save(update_fields=["is_email_verified"])
    return user


def resend_email_verification(email: str) -> None:
    """Silent when the account does not exist or is already verified."""
    user = (
        User.objects.filter(
            email__iexact=email, is_email_verified=False, is_active=True
        )
        .select_related("profile")
        .first()
    )
    if user is None:
        return
    with transaction.atomic():
        start_email_verification(user)
