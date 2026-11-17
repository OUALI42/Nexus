from django.db.models import Count, Q, QuerySet
from django.shortcuts import get_object_or_404

from .models import Subject


def lockers_for(user) -> QuerySet[Subject]:
    """Every read starts here: a student only ever sees their own lockers."""
    return (
        Subject.objects.filter(owner=user)
        .annotate(course_count=Count("documents", filter=Q(documents__kind="course")))
        .order_by("position", "name")
    )


def get_locker(user, pk) -> Subject:
    """404 (not 403) for someone else's locker: its existence is not disclosed."""
    return get_object_or_404(lockers_for(user), pk=pk)
