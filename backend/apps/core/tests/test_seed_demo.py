from io import StringIO

import pytest
from django.core.management import CommandError, call_command

from apps.accounts.models import Profile, User
from apps.billing.models import Subscription
from apps.core.demo.data import DEMO_EMAILS
from apps.core.demo.pdf import build_pdf
from apps.documents.models import Document
from apps.subjects.models import Subject

pytestmark = pytest.mark.django_db

DEMO_PASSWORD = "Revision-demo-2026"


@pytest.fixture
def demo_settings(settings, tmp_path):
    """Development-like settings; uploaded files go to a temporary folder."""
    settings.ALLOW_DEMO_SEED = True
    settings.DEBUG = True
    settings.DEMO_ACCOUNT_PASSWORD = DEMO_PASSWORD
    settings.MEDIA_ROOT = tmp_path
    return settings


def run_seed(*args: str) -> str:
    out = StringIO()
    call_command("seed_demo", *args, stdout=out)
    return out.getvalue()


# --- Safety -------------------------------------------------------------


def test_refuses_to_run_outside_development(demo_settings):
    demo_settings.ALLOW_DEMO_SEED = False

    with pytest.raises(CommandError, match="only runs in development"):
        run_seed()

    assert not User.objects.exists()


def test_refuses_to_run_when_debug_is_off(demo_settings):
    demo_settings.DEBUG = False

    with pytest.raises(CommandError, match="only runs in development"):
        run_seed()


def test_refuses_an_empty_password(demo_settings):
    demo_settings.DEMO_ACCOUNT_PASSWORD = ""

    with pytest.raises(CommandError, match="DEMO_ACCOUNT_PASSWORD is empty"):
        run_seed()

    assert not User.objects.exists()


def test_refuses_a_weak_password(demo_settings):
    demo_settings.DEMO_ACCOUNT_PASSWORD = "12345678"

    with pytest.raises(CommandError, match="too weak"):
        run_seed()

    assert not User.objects.exists()


def test_never_prints_the_password(demo_settings):
    output = run_seed()

    assert DEMO_PASSWORD not in output


# --- Content ------------------------------------------------------------


def test_creates_ready_to_use_demo_students(demo_settings):
    run_seed()

    users = User.objects.filter(email__in=DEMO_EMAILS)
    assert users.count() == 3
    for user in users:
        assert user.is_email_verified
        assert user.check_password(DEMO_PASSWORD)
        profile = Profile.objects.get(user=user)
        assert profile.onboarding_completed_at is not None
    plans = set(
        Subscription.objects.filter(user__in=users).values_list("plan__code", flat=True)
    )
    assert plans == {"basic", "intermediate", "premium"}


def test_creates_lockers_and_real_pdf_courses(demo_settings):
    run_seed()

    assert Subject.objects.count() == 8
    assert Document.objects.count() == 8
    course = Document.objects.get(title="Suites numériques")
    with course.file.open("rb") as stored:
        assert stored.read(5) == b"%PDF-"
    assert course.original_filename == "suites-numeriques.pdf"
    assert "suites" not in course.file.name  # stored under a random name


# --- Idempotence --------------------------------------------------------


def test_can_run_again_without_duplicates(demo_settings):
    run_seed()

    output = run_seed()

    assert User.objects.filter(email__in=DEMO_EMAILS).count() == 3
    assert Subject.objects.count() == 8
    assert Document.objects.count() == 8
    assert "0 account(s) created, 3 updated" in output


def test_reset_recreates_the_demo_accounts(demo_settings):
    run_seed()
    first_ids = set(User.objects.values_list("id", flat=True))

    run_seed("--reset")

    assert User.objects.filter(email__in=DEMO_EMAILS).count() == 3
    assert set(User.objects.values_list("id", flat=True)).isdisjoint(first_ids)
    assert Document.objects.count() == 8


# --- End to end ---------------------------------------------------------


def test_a_demo_student_can_log_in(demo_settings, csrf_post):
    run_seed()

    response = csrf_post(
        "/api/v1/auth/login/",
        {"email": "demo.ines@nexus.test", "password": DEMO_PASSWORD},
    )

    assert response.status_code == 200
    assert response.json()["user"]["username"] == "ines_demo"


# --- PDF generator ------------------------------------------------------


def test_build_pdf_produces_a_complete_pdf_with_accents():
    content = build_pdf("Intégration", ["Une phrase accentuée : é, è, à, ç."])

    assert content.startswith(b"%PDF-1.4")
    assert content.rstrip().endswith(b"%%EOF")
    assert "Intégration".encode("cp1252") in content
