import pytest

pytestmark = pytest.mark.django_db

HEALTH_URL = "/api/v1/health/"


def test_health_returns_ok(api_client):
    response = api_client.get(HEALTH_URL)

    assert response.status_code == 200


def test_unsupported_method_uses_unified_error_format(api_client):
    response = api_client.post(HEALTH_URL)

    assert response.status_code == 405
    body = response.json()
    assert set(body) == {"error"}
    assert {"code", "message"} <= set(body["error"])


def test_security_headers_are_present(api_client):
    response = api_client.get(HEALTH_URL)

    assert response["X-Frame-Options"] == "DENY"
    assert response["X-Content-Type-Options"] == "nosniff"
    assert response["Referrer-Policy"] == "same-origin"
    assert response["Cross-Origin-Opener-Policy"] == "same-origin"