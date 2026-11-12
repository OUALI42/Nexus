import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from apps.accounts.models import Profile


@pytest.fixture(autouse=True)
def _clear_cache():
    """Isolates tests from each other (throttling counters live in the cache)."""
    cache.clear()


@pytest.fixture
def api_client() -> APIClient:
    """API client that enforces CSRF like a real browser."""
    return APIClient(enforce_csrf_checks=True)


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        email="ada@example.com", password="Str0ng-password!"
    )


@pytest.fixture
def verified_user(user):
    """A user who can log in: verified email and a profile."""
    user.is_email_verified = True
    user.save(update_fields=["is_email_verified"])
    Profile.objects.create(user=user, username="ada", track="mpsi")
    return user


@pytest.fixture
def csrf_post(api_client):
    """POST with a fresh CSRF token, like the front-end's API client."""

    def post(url, payload=None):
        api_client.get("/api/v1/auth/csrf/")
        token = api_client.cookies["csrftoken"].value
        return api_client.post(
            url, payload or {}, format="json", HTTP_X_CSRFTOKEN=token
        )

    return post
