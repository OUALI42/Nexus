from django.core.files.uploadedfile import SimpleUploadedFile

from apps.core.demo.pdf import build_pdf

# Django accepts an unmasked 32-char secret both in the cookie and the header.
CSRF_SECRET = "a" * 32


def pdf_file(name="Suites numériques.pdf"):
    return SimpleUploadedFile(
        name, build_pdf("Suites", ["Une suite..."]), "application/pdf"
    )


def upload(client, url, file, **extra):
    return client.post(
        url, {"file": file}, format="multipart", HTTP_X_CSRFTOKEN=CSRF_SECRET, **extra
    )
