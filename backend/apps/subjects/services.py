from django.db import IntegrityError, transaction
from django.db.models import Max
from rest_framework.exceptions import ValidationError

from .icons import LockerIcon
from .models import Subject

NAME_TAKEN_MESSAGE = "Tu as déjà un casier avec ce nom."


def create_locker(
    owner, *, name: str, color: str, icon: str = LockerIcon.FOLDER
) -> Subject:
    """Create a locker at the end of the owner's list."""
    last = Subject.objects.filter(owner=owner).aggregate(last=Max("position"))["last"]
    position = 0 if last is None else last + 1
    try:
        with transaction.atomic():
            return Subject.objects.create(
                owner=owner, name=name, color=color, icon=icon, position=position
            )
    except IntegrityError as exc:
        # Two simultaneous requests can both pass the serializer check:
        # the database unique constraint is the real guard.
        raise ValidationError({"name": [NAME_TAKEN_MESSAGE]}) from exc
