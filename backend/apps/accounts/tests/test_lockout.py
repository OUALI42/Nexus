import pytest
from axes.models import AccessAttempt, AccessFailureLog
from django.contrib.auth import authenticate, login
from django.contrib.sessions.middleware import SessionMiddleware
from django.http import HttpResponse
from django.test import RequestFactory

from apps.accounts.lockout import lockout_response

pytestmark = pytest.mark.django_db

PASSWORD = "Str0ng-password!"  # password of the `user` fixture


def attempt(email: str, password: str):
    """Same sequence as the login view: authenticate, then log in on success."""
    request = RequestFactory().post("/api/v1/auth/login/")
    SessionMiddleware(lambda _request: HttpResponse()).process_request(request)
    user = authenticate(request=request, email=email, password=password)
    if user is not None:
        login(request, user)  # sends user_logged_in: axes resets the counter
    return request, user


def fail(email: str, times: int) -> None:
    for _ in range(times):
        _, result = attempt(email, "wrong-password")
        assert result is None


def test_the_right_password_works(user):
    _, result = attempt("ada@example.com", PASSWORD)

    assert result == user


def test_locks_after_five_failures_even_with_the_right_password(user):
    fail("ada@example.com", 5)

    request, result = attempt("ada@example.com", PASSWORD)

    assert result is None
    assert request.axes_locked_out


def test_a_successful_login_resets_the_counter(user):
    fail("ada@example.com", 4)
    _, result = attempt("ada@example.com", PASSWORD)
    assert result == user

    fail("ada@example.com", 4)
    _, result = attempt("ada@example.com", PASSWORD)
    assert result == user


def test_unknown_addresses_are_locked_the_same_way():
    fail("nobody@example.com", 5)

    request, _ = attempt("nobody@example.com", "anything")

    assert request.axes_locked_out


def test_every_failure_is_logged(user):
    fail("ada@example.com", 2)

    assert AccessFailureLog.objects.filter(username="ada@example.com").count() == 2
    assert (
        AccessAttempt.objects.get(username="ada@example.com").failures_since_start == 2
    )


def test_the_lockout_answer_is_neutral():
    response = lockout_response(RequestFactory().post("/api/v1/auth/login/"))

    assert response.status_code == 429
    assert response["Retry-After"] == "900"
    assert b"too_many_attempts" in response.content
