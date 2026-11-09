from django.db import transaction

from .models import PrivacyConsent, Profile, User


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
    # Step 3: the verification email will be sent here, after commit.
    return user
