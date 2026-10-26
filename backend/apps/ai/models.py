import uuid

from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class AIJob(TimeStampedModel):
    class Kind(models.TextChoices):
        SHEET_GENERATION = "sheet_generation", "Génération de fiche"
        QUIZ_GENERATION = "quiz_generation", "Génération de QCM"
        CHAT_ANSWER = "chat_answer", "Réponse de l'assistant"
        DOCUMENT_INGESTION = "document_ingestion", "Ingestion de document"

    class Status(models.TextChoices):
        QUEUED = "queued", "En file"
        RUNNING = "running", "En cours"
        SUCCEEDED = "succeeded", "Terminé"
        FAILED = "failed", "Échec"

    # Exposed in the API instead of the sequential id
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_jobs"
    )
    kind = models.CharField(max_length=30, choices=Kind.choices)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.QUEUED
    )
    cost = models.PositiveSmallIntegerField(default=0)  # AI credits (ADR-008)
    input = models.JSONField(default=dict, blank=True)
    result = models.JSONField(default=dict, blank=True)  # e.g. {"sheet_id": 12}
    error = models.TextField(blank=True)
    prompt_tokens = models.PositiveIntegerField(default=0)
    completion_tokens = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "job IA"
        verbose_name_plural = "jobs IA"
        ordering = ["-created_at"]
        indexes = [
            # Monthly credit usage: SUM(cost) WHERE user = ? AND created_at >= month start
            models.Index(fields=["user", "created_at"], name="aijob_user_created_idx"),
        ]

    def __str__(self):
        return f"{self.get_kind_display()} — {self.status}"
