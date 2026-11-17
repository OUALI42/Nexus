import pytest

from apps.subjects.models import Subject

from .helpers import CSRF_SECRET


@pytest.fixture(autouse=True)
def _media_in_tmp(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path


@pytest.fixture
def other_user(django_user_model):
    return django_user_model.objects.create_user(
        email="grace@example.com", password="Str0ng-password!"
    )


@pytest.fixture
def logged_client(api_client, verified_user):
    api_client.force_login(verified_user)
    api_client.cookies["csrftoken"] = CSRF_SECRET
    return api_client


@pytest.fixture
def locker(verified_user):
    return Subject.objects.create(owner=verified_user, name="Maths", color="#4338ca")
