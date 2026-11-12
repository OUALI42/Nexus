import pytest
from django.contrib.sessions.models import Session
from rest_framework.throttling import ScopedRateThrottle

pytestmark = pytest.mark.django_db

LOGIN_URL = "/api/v1/auth/login/"
LOGOUT_URL = "/api/v1/auth/logout/"
SESSION_URL = "/api/v1/auth/session/"
PASSWORD = "Str0ng-password!"


def credentials(email="ada@example.com", password=PASSWORD):
    return {"email": email, "password": password}


def error(response):
    return response.json()["error"]


def test_logs_in_with_an_httponly_session_cookie(verified_user, csrf_post):
    response = csrf_post(LOGIN_URL, credentials())

    assert response.status_code == 200
    body = response.json()
    assert body["authenticated"] is True
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["plan"]["code"] == "basic"
    cookie = response.cookies["sessionid"]
    assert cookie["httponly"] is True


def test_the_email_is_case_insensitive(verified_user, csrf_post):
    response = csrf_post(LOGIN_URL, credentials(email="ADA@Example.com"))

    assert response.status_code == 200


def test_wrong_password_and_unknown_email_get_the_same_answer(verified_user, csrf_post):
    wrong_password = csrf_post(LOGIN_URL, credentials(password="wrong-password"))
    unknown_email = csrf_post(LOGIN_URL, credentials(email="nobody@example.com"))

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert error(wrong_password) == error(unknown_email)
    assert error(wrong_password)["code"] == "invalid_credentials"


def test_login_requires_a_csrf_token(verified_user, api_client):
    response = api_client.post(LOGIN_URL, credentials(), format="json")

    assert response.status_code == 403


def test_an_unverified_email_cannot_log_in(user, csrf_post, api_client):
    response = csrf_post(LOGIN_URL, credentials())

    assert response.status_code == 403
    assert error(response)["code"] == "email_not_verified"
    assert api_client.get(SESSION_URL).json()["authenticated"] is False


def test_locks_out_after_five_failures_with_a_neutral_message(
    verified_user, csrf_post, monkeypatch
):
    # Isolate axes from DRF's own throttling, tested elsewhere.
    monkeypatch.setattr(ScopedRateThrottle, "allow_request", lambda *args: True)
    for _ in range(5):
        csrf_post(LOGIN_URL, credentials(password="wrong-password"))

    response = csrf_post(LOGIN_URL, credentials())

    assert response.status_code == 429
    assert error(response)["code"] == "too_many_attempts"


def test_login_renews_the_csrf_token(verified_user, csrf_post, api_client):
    api_client.get("/api/v1/auth/csrf/")
    token_before = api_client.cookies["csrftoken"].value

    csrf_post(LOGIN_URL, credentials())

    assert api_client.cookies["csrftoken"].value != token_before


def test_first_login_asks_for_onboarding_then_not_anymore(verified_user, csrf_post):
    first = csrf_post(LOGIN_URL, credentials())
    assert first.json()["user"]["needs_onboarding"] is True

    completed = csrf_post("/api/v1/auth/onboarding/complete/")
    assert completed.status_code == 204

    session = csrf_post(LOGIN_URL, credentials())
    assert session.json()["user"]["needs_onboarding"] is False


def test_logout_destroys_the_session_server_side(verified_user, csrf_post, api_client):
    csrf_post(LOGIN_URL, credentials())
    session_key = api_client.cookies["sessionid"].value
    assert Session.objects.filter(session_key=session_key).exists()

    response = csrf_post(LOGOUT_URL)

    assert response.status_code == 204
    assert not Session.objects.filter(session_key=session_key).exists()
    assert api_client.get(SESSION_URL).json()["authenticated"] is False


def test_logging_out_twice_is_harmless(csrf_post):
    assert csrf_post(LOGOUT_URL).status_code == 204


def test_anonymous_session_exposes_the_idle_timeout(api_client):
    body = api_client.get(SESSION_URL).json()

    assert body["authenticated"] is False
    assert body["user"] is None
    assert body["idle_timeout"] == 30 * 60
    assert body["idle_warning"] == 2 * 60
