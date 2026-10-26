import uuid
from pathlib import Path

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


def document_upload_to(instance, filename):
    # Random name: the original filename is only kept in the database (ADR-007).
    extension = Path(filename).suffix.lower()
    return f"documents/{instance.owner_id}/{uuid.uuid4().hex}{extension}"


class Document(TimeStampedModel):
    class Kind(models.TextChoices):
        COURSE = "course", "Cours"
        REPORT_CARD = "report_card", "Bulletin"
        OTHER = "other", "Autre"

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        PROCESSING = "processing", "En cours de traitement"
        READY = "ready", "Prêt"
        FAILED = "failed", "Échec"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="documents"
    )
    subject = models.ForeignKey(
        "subjects.Subject",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    title = models.CharField(max_length=255)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.COURSE)
    file = models.FileField(upload_to=document_upload_to, max_length=255)
    original_filename = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    size_bytes = models.PositiveBigIntegerField()
    sha256 = models.CharField(max_length=64)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    page_count = models.PositiveIntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        verbose_name = "document"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "subject"], name="doc_owner_subject_idx"),
            models.Index(fields=["owner", "-created_at"], name="doc_owner_created_idx"),
            models.Index(fields=["owner", "sha256"], name="doc_owner_sha_idx"),
        ]

    def __str__(self):
        return self.title


class Chunk(models.Model):
    """Text fragment of a document. Its id is also the Qdrant point id (ADR-004)."""

    document = models.ForeignKey(
        Document, on_delete=models.CASCADE, related_name="chunks"
    )
    position = models.PositiveIntegerField()
    content = models.TextField()
    token_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["document", "position"]
        constraints = [
            models.UniqueConstraint(
                fields=["document", "position"], name="uniq_chunk_document_position"
            ),
        ]

    def __str__(self):
        return f"{self.document_id}#{self.position}"
