from django.conf import settings
from django.db import models

from apps.core.models import ContentSource, TimeStampedModel


class RevisionSheet(TimeStampedModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="revision_sheets",
    )
    subject = models.ForeignKey(
        "subjects.Subject",
        on_delete=models.CASCADE,
        related_name="revision_sheets",
    )
    ai_job = models.ForeignKey(
        "ai.AIJob",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revision_sheets",
    )
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)  # Sanitized HTML (nh3), LONGTEXT on MySQL
    source = models.CharField(
        max_length=10, choices=ContentSource.choices, default=ContentSource.MANUAL
    )
    documents = models.ManyToManyField(
        "documents.Document", blank=True, related_name="revision_sheets"
    )

    class Meta:
        verbose_name = "fiche de révision"
        verbose_name_plural = "fiches de révision"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(
                fields=["owner", "-updated_at"], name="sheet_owner_updated_idx"
            ),
            models.Index(
                fields=["subject", "-updated_at"], name="sheet_subject_updated_idx"
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(title=""),
                name="sheet_title_not_empty",
            ),
        ]

    def __str__(self):
        return self.title
