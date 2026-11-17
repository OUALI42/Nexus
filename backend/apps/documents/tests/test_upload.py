import hashlib

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from apps.documents.models import Document
from apps.subjects.models import Subject

from .helpers import pdf_file, upload

pytestmark = pytest.mark.django_db


def courses_url(locker):
    return reverse("lockers:courses", args=[locker.pk])


def test_a_student_uploads_a_pdf_to_their_locker(logged_client, locker):
    file = pdf_file()
    content = file.read()
    file.seek(0)

    response = upload(logged_client, courses_url(locker), file)

    assert response.status_code == 201
    assert response.json()["title"] == "Suites numériques"
    assert "file" not in response.json()
    document = Document.objects.get(pk=response.json()["id"])
    assert document.subject == locker
    assert document.size_bytes == len(content)
    assert document.sha256 == hashlib.sha256(content).hexdigest()
    assert document.original_filename == "Suites numériques.pdf"
    assert document.mime_type == "application/pdf"
    assert response.json()["analysis_status"] == document.status
    assert "Suites" not in document.file.name


def test_a_renamed_file_is_rejected_by_its_signature(logged_client, locker):
    fake = SimpleUploadedFile("cours.pdf", b"MZ\x90\x00 not a pdf", "application/pdf")

    response = upload(logged_client, courses_url(locker), fake)

    assert response.status_code == 400
    assert "file" in response.json()["error"]["details"]
    assert not Document.objects.exists()


def test_an_empty_file_is_rejected(logged_client, locker):
    empty = SimpleUploadedFile("vide.pdf", b"", "application/pdf")

    response = upload(logged_client, courses_url(locker), empty)

    assert response.status_code == 400


def test_a_file_over_the_plan_limit_is_rejected(logged_client, locker, monkeypatch):
    monkeypatch.setattr("apps.documents.views.max_upload_size_for", lambda user: 100)

    response = upload(logged_client, courses_url(locker), pdf_file())

    assert response.status_code == 400
    assert "file" in response.json()["error"]["details"]


def test_an_oversized_request_is_refused_before_reading_it(
    logged_client, locker, monkeypatch
):
    monkeypatch.setattr("apps.documents.views.max_upload_size_for", lambda user: 100)
    big = SimpleUploadedFile("gros.pdf", b"%PDF-" + b"0" * 100_000, "application/pdf")

    response = upload(logged_client, courses_url(locker), big)

    assert response.status_code == 413
    assert response.json()["error"]["code"] == "file_too_large"


def test_a_student_cannot_upload_to_another_students_locker(logged_client, other_user):
    foreign = Subject.objects.create(owner=other_user, name="Secret", color="#6d28d9")

    response = upload(logged_client, courses_url(foreign), pdf_file())

    assert response.status_code == 404
    assert not Document.objects.exists()


def test_uploading_requires_the_csrf_token(logged_client, locker):
    response = logged_client.post(
        courses_url(locker), {"file": pdf_file()}, format="multipart"
    )

    assert response.status_code == 403


def test_the_locker_lists_its_courses_and_counts_them(
    logged_client, locker, verified_user
):
    other_locker = Subject.objects.create(
        owner=verified_user, name="Physique", color="#0e7490"
    )
    upload(logged_client, courses_url(locker), pdf_file("Suites.pdf"))
    upload(logged_client, courses_url(other_locker), pdf_file("Optique.pdf"))

    response = logged_client.get(courses_url(locker))

    assert [course["title"] for course in response.json()] == ["Suites"]
    lockers = logged_client.get(reverse("lockers:list")).json()
    assert {item["name"]: item["course_count"] for item in lockers} == {
        "Maths": 1,
        "Physique": 1,
    }
