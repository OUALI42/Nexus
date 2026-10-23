import pytest
from django.urls import path
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.views import CsrfTokenView

pytestmark = pytest.mark.django_db

CSRF_URL = "/api/v1/auth/csrf/"


class ProtectedEchoView(APIView):
    """Test-only view relying on the global DRF authentication defaults."""

    def post(self, request: Request) -> Response:
        return Response({"ok": True})


# Used by @pytest.mark.urls(__name__) to replace the project routes.
urlpatterns = [
    path("csrf/", CsrfTokenView.as_view()),
    path("echo/", ProtectedEchoView.as_view()),
]


def test_csrf_endpoint_sets_readable_lax_cookie(api_client):
    response = api_client.get(CSRF_URL)

    assert response.status_code == 204
    cookie = response.cookies["csrftoken"]
    assert cookie.value
    assert cookie["samesite"] == "Lax"
    assert not cookie["httponly"]


@pytest.mark.urls(__name__)
def test_authenticated_post_without_csrf_token_is_rejected(api_client, user):
    api_client.force_login(user)

    response = api_client.post("/echo/")

    assert response.status_code == 403
    assert "error" in response.json()


@pytest.mark.urls(__name__)
def test_authenticated_post_with_csrf_token_is_accepted(api_client, user):
    api_client.force_login(user)
    api_client.get("/csrf/")  # after login: Django rotates the token on login
    token = api_client.cookies["csrftoken"].value

    response = api_client.post("/echo/", HTTP_X_CSRFTOKEN=token)

    assert response.status_code == 200
