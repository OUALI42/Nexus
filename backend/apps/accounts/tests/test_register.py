import pytest
from django.conf import settings

from apps.accounts.models import PrivacyConsent, Profile, User
from apps.billing.models import Subscription

pytestmark = pytest.mark.django_db

CSRF_URL = "/api/v1/auth/csrf/"
REGISTER_URL = "/api/v1/auth/register/"


def valid_payload(**overrides):
    payload = {
        "email": "ada@example.com",
        "password": "Correct-horse-42",
        "username": "ada",
        "track": "mpsi",
        "privacy_policy_accepted": True,
        "privacy_policy_version": settings.PRIVACY_POLICY_VERSION,
    }
    payload.update(overrides)
    return payload


def register(api_client, payload):
    api_client.get(CSRF_URL)
    token = api_client.cookies["csrftoken"].value
    return api_client.post(REGISTER_URL, payload, format="json", HTTP_X_CSRFTOKEN=token)


def error_fields(response):
    return set(response.json()["error"]["details"])


def test_creates_account_profile_consent_and_subscription(api_client):
    response = register(api_client, valid_payload())

    assert response.status_code == 201
    user = User.objects.get(email="ada@example.com")
    assert Profile.objects.filter(user=user, username="ada", track="mpsi").exists()
    consent = PrivacyConsent.objects.get(user=user)
    assert consent.policy_version == settings.PRIVACY_POLICY_VERSION
    assert consent.accepted_at is not None
    assert Subscription.objects.filter(user=user).exists()
    assert not user.is_email_verified


def test_password_is_hashed_and_never_returned(api_client):
    response = register(api_client, valid_payload())

    body = response.json()
    assert "password" not in body
    assert "Correct-horse-42" not in response.content.decode()
    user = User.objects.get(email="ada@example.com")
    assert user.password != "Correct-horse-42"
    assert user.check_password("Correct-horse-42")


def test_is_rejected_without_csrf_token(api_client):
    response = api_client.post(REGISTER_URL, valid_payload(), format="json")

    assert response.status_code == 403
    assert "error" in response.json()
    assert not User.objects.exists()


def test_email_must_be_unique_case_insensitively(api_client):
    register(api_client, valid_payload())

    response = register(
        api_client, valid_payload(email="ADA@example.com", username="grace")
    )

    assert response.status_code == 400
    assert error_fields(response) == {"email"}


def test_username_must_be_unique_case_insensitively(api_client):
    register(api_client, valid_payload())

    response = register(
        api_client, valid_payload(email="grace@example.com", username="ADA")
    )

    assert response.status_code == 400
    assert error_fields(response) == {"username"}


def test_reports_every_invalid_field_at_once(api_client):
    response = register(
        api_client,
        valid_payload(
            email="not-an-email",
            password="123",
            username="a",
            track="astrophysics",
            privacy_policy_accepted=False,
        ),
    )

    assert response.status_code == 400
    assert error_fields(response) == {
        "email",
        "password",
        "username",
        "track",
        "privacy_policy_accepted",
    }
    assert not User.objects.exists()


def test_rejects_a_password_too_close_to_the_email(api_client):
    response = register(
        api_client,
        valid_payload(email="mathieu.durand@example.com", password="mathieu.durand"),
    )

    assert error_fields(response) == {"password"}


def test_rejects_an_outdated_privacy_policy_version(api_client):
    response = register(api_client, valid_payload(privacy_policy_version="2020-01"))

    assert error_fields(response) == {"privacy_policy_version"}


def test_rejects_a_reserved_username(api_client):
    response = register(api_client, valid_payload(username="Admin"))

    assert error_fields(response) == {"username"}


def test_lists_tracks_by_group(api_client):
    response = api_client.get("/api/v1/auth/tracks/")

    assert response.status_code == 200
    groups = response.json()
    assert [group["label"] for group in groups] == [
        "Classes préparatoires",
        "Autres études",
    ]
    assert {"value": "mpsi", "label": "MPSI"} in groups[0]["options"]


def test_exposes_the_privacy_policy_version(api_client):
    response = api_client.get("/api/v1/auth/privacy-policy/")

    assert response.json() == {"version": settings.PRIVACY_POLICY_VERSION}
