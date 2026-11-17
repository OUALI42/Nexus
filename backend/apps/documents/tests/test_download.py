import pytest
from django.urls import reverse

from apps.documents.services import upload_course

from .helpers import pdf_file

pytestmark = pytest.mark.django_db


@pytest.fixture
def course(locker):
    return upload_course(locker, pdf_file())


def file_url(course):
    return reverse("courses:file", args=[course.pk])


def read(response) -> bytes:
    content = b"".join(response.streaming_content)
    response.close()
    return content


def test_the_owner_opens_their_course_in_the_browser(logged_client, course):
    response = logged_client.get(file_url(course))

    assert response.status_code == 200
    assert response["Content-Type"] == "application/pdf"
    assert response["Content-Disposition"].startswith("inline")
    assert read(response).startswith(b"%PDF-")


def test_the_owner_can_force_the_download(logged_client, course):
    response = logged_client.get(file_url(course), {"download": "1"})

    assert response["Content-Disposition"].startswith("attachment")
    assert "Suites" in response["Content-Disposition"]
    response.close()


def test_a_course_is_never_kept_in_a_cache(logged_client, course):
    response = logged_client.get(file_url(course))

    assert "no-store" in response["Cache-Control"]
    assert "private" in response["Cache-Control"]
    response.close()


def test_a_student_cannot_open_another_students_course(api_client, other_user, course):
    api_client.force_login(other_user)

    response = api_client.get(file_url(course))

    assert response.status_code == 404


def test_an_anonymous_visitor_cannot_open_a_course(api_client, course):
    response = api_client.get(file_url(course))

    assert response.status_code == 403


def test_a_course_missing_on_disk_returns_404(logged_client, course):
    course.file.storage.delete(course.file.name)

    response = logged_client.get(file_url(course))

    assert response.status_code == 404


def test_each_listed_course_gives_its_file_url(logged_client, course, locker):
    response = logged_client.get(reverse("lockers:courses", args=[locker.pk]))

    assert response.json()[0]["file_url"] == file_url(course)
