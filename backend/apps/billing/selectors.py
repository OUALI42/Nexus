from django.conf import settings

from .models import Subscription


def max_upload_size_for(user) -> int:
    """Max size of an uploaded file, in bytes, according to the student's plan."""
    subscription = Subscription.objects.select_related("plan").filter(user=user).first()
    if subscription is None:
        return settings.DEFAULT_MAX_UPLOAD_SIZE
    return subscription.plan.max_file_size_bytes
