from django.conf import settings
from django.db import models
from django.db.models import F, Q

from apps.core.models import TimeStampedModel


class Event(TimeStampedModel):
    class Kind(models.TextChoices):
        EXAM = "exam", "Examen"
        TEST = "test", "Contrôle"
        HOMEWORK = "homework", "Devoir"
        OTHER = "other", "Autre"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="events"
    )
    subject = models.ForeignKey(
        "subjects.Subject",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    title = models.CharField(max_length=200)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.EXAM)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "événement"
        ordering = ["starts_at"]
        indexes = [
            models.Index(fields=["owner", "starts_at"], name="event_owner_starts_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(ends_at__isnull=True) | Q(ends_at__gte=F("starts_at")),
                name="event_ends_after_starts",
            ),
        ]

    def __str__(self):
        return self.title


class Reminder(models.Model):
    class Channel(models.TextChoices):
        IN_APP = "in_app", "Dans l'application"
        EMAIL = "email", "E-mail"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="reminders")
    remind_at = models.DateTimeField()
    channel = models.CharField(
        max_length=10, choices=Channel.choices, default=Channel.IN_APP
    )
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "rappel"
        ordering = ["remind_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["event", "remind_at", "channel"],
                name="uniq_reminder_event_at_channel",
            ),
        ]
        indexes = [
            # Used by the Celery Beat task looking for due reminders
            models.Index(fields=["sent_at", "remind_at"], name="reminder_due_idx"),
        ]

    def __str__(self):
        return f"{self.event} @ {self.remind_at:%Y-%m-%d %H:%M}"
