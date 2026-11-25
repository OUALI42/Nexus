from django.db.models import QuerySet
from django.shortcuts import get_object_or_404

from .models import RevisionSheet


def sheets_in(locker) -> QuerySet[RevisionSheet]:
    return RevisionSheet.objects.filter(subject=locker).order_by("-updated_at")


def get_sheet(user, pk) -> RevisionSheet:
    """404 (not 403) for someone else's sheet: its existence is not disclosed."""
    return get_object_or_404(
        RevisionSheet.objects.filter(owner=user, subject__owner=user), pk=pk
    )
