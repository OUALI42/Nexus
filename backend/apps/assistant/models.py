from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel


class Conversation(TimeStampedModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations"
    )
    subject = models.ForeignKey(
        "subjects.Subject",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conversations",
    )
    title = models.CharField(max_length=200, blank=True)
    # Optional scope: restrict retrieval to these documents
    documents = models.ManyToManyField(
        "documents.Document", blank=True, related_name="conversations"
    )

    class Meta:
        verbose_name = "conversation"
        ordering = ["-updated_at"]
        indexes = [
            models.Index(
                fields=["owner", "-updated_at"], name="conv_owner_updated_idx"
            ),
        ]

    def __str__(self):
        return self.title or f"Conversation {self.pk}"


class Message(models.Model):
    class Role(models.TextChoices):
        USER = "user", "Utilisateur"
        ASSISTANT = "assistant", "Assistant"

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    ai_job = models.ForeignKey(
        "ai.AIJob",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messages",
    )
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField(blank=True)
    sources = models.JSONField(default=list, blank=True)  # cited chunk ids
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(
                fields=["conversation", "created_at"], name="msg_conv_created_idx"
            ),
        ]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"
