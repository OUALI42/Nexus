from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel

DEFAULT_PLAN_CODE = "basic"


class Plan(TimeStampedModel):
    code = models.SlugField(max_length=20, unique=True)
    name = models.CharField(max_length=50)
    monthly_price_cents = models.PositiveIntegerField(default=0)  # never store money as float
    storage_quota_bytes = models.PositiveBigIntegerField()
    max_file_size_bytes = models.PositiveBigIntegerField()
    monthly_ai_credits = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "offre"
        ordering = ["monthly_price_cents"]

    def __str__(self):
        return self.name


class Subscription(TimeStampedModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CANCELED = "canceled", "Résiliée"
        EXPIRED = "expired", "Expirée"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscription"
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    started_at = models.DateTimeField(default=timezone.now)
    current_period_end = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "abonnement"

    def __str__(self):
        return f"{self.user} → {self.plan}"