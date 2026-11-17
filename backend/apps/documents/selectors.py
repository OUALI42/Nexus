from django.db.models import QuerySet

from .models import Document


def courses_in(locker) -> QuerySet[Document]:
    return Document.objects.filter(subject=locker, kind="course").order_by(
        "-created_at"
    )
