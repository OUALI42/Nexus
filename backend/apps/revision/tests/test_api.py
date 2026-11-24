import pytest
from django.urls import reverse

from apps.revision.models import RevisionSheet
from apps.revision.serializers import MAX_CONTENT_LENGTH
from apps.subjects.models import Subject

from .conftest import CSRF_SECRET

pytestmark = pytest.mark.django_db


def sheets_url(locker):
    return reverse("lockers:sheets", args=[locker.pk])


def sheet_url(sheet):
    return reverse("sheets:detail", args=[sheet.pk])


def send(client, method, url, payload=None):
    return getattr(client, method)(
        url, payload, format="json", HTTP_X_CSRFTOKEN=CSRF_SECRET
    )


@pytest.fixture
def sheet(verified_user, locker):
    return RevisionSheet.objects.create(
        owner=verified_user, subject=locker, title="Suites", content="<p>Cours</p>"
    )


@pytest.fixture
def foreign_sheet(other_user):
    locker = Subject.objects.create(owner=other_user, name="Secret", color="#6d28d9")
    return RevisionSheet.objects.create(
        owner=other_user, subject=locker, title="Privé", content="<p>Privé</p>"
    )


# --- Reading -------------------------------------------------------------


def test_an_anonymous_visitor_cannot_list_sheets(api_client, locker):
    response = api_client.get(sheets_url(locker))

    assert response.status_code == 403


def test_a_locker_lists_only_its_own_sheets_newest_first(
    logged_client, verified_user, locker
):
    other_locker = Subject.objects.create(
        owner=verified_user, name="Physique", color="#0e7490"
    )
    RevisionSheet.objects.create(owner=verified_user, subject=locker, title="Ancienne")
    RevisionSheet.objects.create(owner=verified_user, subject=locker, title="Récente")
    RevisionSheet.objects.create(
        owner=verified_user, subject=other_locker, title="Optique"
    )

    response = logged_client.get(sheets_url(locker))

    assert response.status_code == 200
    assert [item["title"] for item in response.json()] == ["Récente", "Ancienne"]
    assert "content" not in response.json()[0]


def test_a_student_reads_their_sheet(logged_client, sheet, locker):
    response = logged_client.get(sheet_url(sheet))

    assert response.status_code == 200
    assert response.json()["content"] == "<p>Cours</p>"
    assert response.json()["locker_id"] == locker.pk


def test_a_student_cannot_read_another_students_sheet(logged_client, foreign_sheet):
    response = logged_client.get(sheet_url(foreign_sheet))

    assert response.status_code == 404


# --- Creating ------------------------------------------------------------


def test_a_student_creates_a_sheet_with_sanitized_content(
    logged_client, verified_user, locker
):
    response = send(
        logged_client,
        "post",
        sheets_url(locker),
        {"title": "  Suites  ", "content": "<p>Def</p><script>alert(1)</script>"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Suites"
    assert body["content"] == "<p>Def</p>"
    sheet = RevisionSheet.objects.get(pk=body["id"])
    assert sheet.owner == verified_user
    assert sheet.subject == locker


def test_a_sheet_needs_a_title(logged_client, locker):
    response = send(logged_client, "post", sheets_url(locker), {"title": "   "})

    assert response.status_code == 400
    assert "title" in response.json()["error"]["details"]


def test_the_content_size_is_limited(logged_client, locker):
    too_long = "<p>" + "a" * MAX_CONTENT_LENGTH + "</p>"

    response = send(
        logged_client,
        "post",
        sheets_url(locker),
        {"title": "Long", "content": too_long},
    )

    assert response.status_code == 400
    assert "content" in response.json()["error"]["details"]


def test_a_student_cannot_create_a_sheet_in_another_students_locker(
    logged_client, other_user
):
    foreign = Subject.objects.create(owner=other_user, name="Secret", color="#6d28d9")

    response = send(logged_client, "post", sheets_url(foreign), {"title": "Intrus"})

    assert response.status_code == 404
    assert not RevisionSheet.objects.filter(title="Intrus").exists()


# --- Updating ------------------------------------------------------------


def test_updating_the_title_keeps_the_content(logged_client, sheet):
    response = send(logged_client, "patch", sheet_url(sheet), {"title": "Suites (v2)"})

    assert response.status_code == 200
    sheet.refresh_from_db()
    assert sheet.title == "Suites (v2)"
    assert sheet.content == "<p>Cours</p>"


def test_updated_content_is_sanitized(logged_client, sheet):
    response = send(
        logged_client,
        "patch",
        sheet_url(sheet),
        {"content": '<p onclick="alert(1)">Nouveau</p>'},
    )

    assert response.status_code == 200
    assert response.json()["content"] == "<p>Nouveau</p>"


def test_a_student_cannot_update_another_students_sheet(logged_client, foreign_sheet):
    response = send(logged_client, "patch", sheet_url(foreign_sheet), {"title": "Volé"})

    assert response.status_code == 404
    foreign_sheet.refresh_from_db()
    assert foreign_sheet.title == "Privé"


def test_updating_requires_the_csrf_token(logged_client, sheet):
    response = logged_client.patch(sheet_url(sheet), {"title": "X"}, format="json")

    assert response.status_code == 403


# --- Deleting ------------------------------------------------------------


def test_a_student_deletes_their_sheet(logged_client, sheet):
    response = send(logged_client, "delete", sheet_url(sheet))

    assert response.status_code == 204
    assert not RevisionSheet.objects.filter(pk=sheet.pk).exists()


def test_a_student_cannot_delete_another_students_sheet(logged_client, foreign_sheet):
    response = send(logged_client, "delete", sheet_url(foreign_sheet))

    assert response.status_code == 404
    assert RevisionSheet.objects.filter(pk=foreign_sheet.pk).exists()
