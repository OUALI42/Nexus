import pytest
from django.db import IntegrityError

from apps.accounts.models import PrivacyConsent, Profile
from apps.accounts.tracks import Track

pytestmark = pytest.mark.django_db


def test_username_is_unique_case_insensitively(user, django_user_model):
    other = django_user_model.objects.create_user(
        email="grace@example.com", password="Str0ng-password!"
    )
    Profile.objects.create(user=user, username="Ouali", track=Track.MPSI)

    with pytest.raises(IntegrityError):
        Profile.objects.create(user=other, username="ouali", track=Track.PCSI)


def test_profile_and_consents_are_deleted_with_the_user(user):
    Profile.objects.create(user=user, username="ada", track=Track.MPSI)
    PrivacyConsent.objects.create(user=user, policy_version="2026-11")

    user.delete()

    assert not Profile.objects.exists()
    assert not PrivacyConsent.objects.exists()


def test_a_version_is_consented_once_per_user(user):
    PrivacyConsent.objects.create(user=user, policy_version="2026-11")

    with pytest.raises(IntegrityError):
        PrivacyConsent.objects.create(user=user, policy_version="2026-11")


def test_email_is_not_verified_by_default(user):
    assert not user.is_email_verified
