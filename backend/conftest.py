import pytest
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture
def api_client() -> APIClient:
    """API client that enforces CSRF like a real browser."""
    return APIClient(enforce_csrf_checks=True)


@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        email="ada@example.com", password="Str0ng-password!"
    )


@pytest.fixture(autouse=True)
def _clear_cache():
    """Isolates tests from each other (throttling counters live in the cache)."""
    cache.clear()
