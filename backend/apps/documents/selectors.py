from django.db.models import QuerySet
from django.shortcuts import get_object_or_404

from .models import Document


def courses_in(locker) -> QuerySet[Document]:
    return Document.objects.filter(subject=locker, kind="course").order_by(
        "-created_at"
    )


def get_course(user, pk) -> Document:
    """404 for someone else's course: its existence is not disclosed."""
    return get_object_or_404(Document.objects.filter(owner=user, kind="course"), pk=pk)
