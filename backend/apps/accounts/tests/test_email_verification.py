import re
from datetime import timedelta

import pytest
from django.conf import settings
from django.core import mail
from django.utils.timezone import now

from apps.accounts.models import EmailVerificationToken, User
from apps.accounts.tests.test_register import register, valid_payload

pytestmark = pytest.mark.django_db

VERIFY_URL = "/api/v1/auth/verify-email/"
RESEND_URL = "/api/v1/auth/resend-verification/"
TOKEN_IN_LINK = re.compile(r"token=([\w-]+)")


def post_with_csrf(api_client, url, payload):
    api_client.get("/api/v1/auth/csrf/")
    token = api_client.cookies["csrftoken"].value
    return api_client.post(url, payload, format="json", HTTP_X_CSRFTOKEN=token)


def last_token_sent():
    match = TOKEN_IN_LINK.search(mail.outbox[-1].body)
    assert match, "no verification link in the last email"
    return match.group(1)


@pytest.fixture
def registered_token(api_client, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        register(api_client, valid_payload())
    return last_token_sent()


def error_code(response):
    return response.json()["error"]["code"]


def test_registration_sends_one_verification_email(registered_token):
    assert len(mail.outbox) == 1
    email = mail.outbox[0]
    assert email.to == ["ada@example.com"]
    assert f"{settings.FRONTEND_URL}/verifier-email?token=" in email.body
    assert email.alternatives, "an HTML version is attached"


def test_only_the_token_hash_is_stored(registered_token):
    assert EmailVerificationToken.objects.count() == 1
    assert not EmailVerificationToken.objects.filter(
        token_hash=registered_token
    ).exists()


def test_a_valid_token_verifies_the_email(api_client, registered_token):
    response = post_with_csrf(api_client, VERIFY_URL, {"token": registered_token})

    assert response.status_code == 204
    assert User.objects.get(email="ada@example.com").is_email_verified


def test_a_token_works_only_once(api_client, registered_token):
    post_with_csrf(api_client, VERIFY_URL, {"token": registered_token})

    response = post_with_csrf(api_client, VERIFY_URL, {"token": registered_token})

    assert response.status_code == 400
    assert error_code(response) == "token_used"


def test_an_expired_token_is_rejected(api_client, registered_token):
    EmailVerificationToken.objects.update(expires_at=now() - timedelta(seconds=1))

    response = post_with_csrf(api_client, VERIFY_URL, {"token": registered_token})

    assert error_code(response) == "token_expired"
    assert not User.objects.get(email="ada@example.com").is_email_verified


def test_an_unknown_token_is_rejected(api_client):
    response = post_with_csrf(api_client, VERIFY_URL, {"token": "made-up-token"})

    assert error_code(response) == "token_invalid"


def test_a_new_link_revokes_the_previous_one(
    api_client, registered_token, django_capture_on_commit_callbacks
):
    with django_capture_on_commit_callbacks(execute=True):
        response = post_with_csrf(api_client, RESEND_URL, {"email": "ada@example.com"})
    new_token = last_token_sent()

    assert response.status_code == 202
    assert new_token != registered_token
    old = post_with_csrf(api_client, VERIFY_URL, {"token": registered_token})
    assert error_code(old) == "token_invalid"
    new = post_with_csrf(api_client, VERIFY_URL, {"token": new_token})
    assert new.status_code == 204


def test_resend_does_not_reveal_unknown_addresses(
    api_client, django_capture_on_commit_callbacks
):
    with django_capture_on_commit_callbacks(execute=True):
        response = post_with_csrf(
            api_client, RESEND_URL, {"email": "nobody@example.com"}
        )

    assert response.status_code == 202
    assert mail.outbox == []


def test_verification_requires_a_csrf_token(api_client, registered_token):
    response = api_client.post(VERIFY_URL, {"token": registered_token}, format="json")

    assert response.status_code == 403
