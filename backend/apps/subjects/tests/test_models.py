import pytest
from django.db import IntegrityError

from apps.subjects.icons import LockerIcon
from apps.subjects.models import Subject

pytestmark = pytest.mark.django_db


def test_a_locker_has_a_folder_icon_by_default(user):
    subject = Subject.objects.create(owner=user, name="Philosophie", color="#4338ca")

    assert subject.icon == LockerIcon.FOLDER


def test_the_database_rejects_an_unknown_icon(user):
    with pytest.raises(IntegrityError):
        Subject.objects.create(
            owner=user, name="Philosophie", color="#4338ca", icon="skull"
        )


def test_two_lockers_cannot_share_a_name_whatever_the_case(user):
    Subject.objects.create(owner=user, name="Maths", color="#4338ca")

    with pytest.raises(IntegrityError):
        Subject.objects.create(owner=user, name="maths", color="#0e7490")
