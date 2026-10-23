from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import DEFAULT_PLAN_CODE, Plan, Subscription


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_default_subscription(sender, instance, created, raw=False, **kwargs):
    """Every new user starts on the free plan, whatever the creation path (API, admin, shell)."""
    if not created or raw:
        return
    Subscription.objects.create(user=instance, plan=Plan.objects.get(code=DEFAULT_PLAN_CODE))