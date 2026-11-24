import pytest
from django.db import IntegrityError

from apps.core.models import ContentSource
from apps.revision.models import RevisionSheet
from apps.subjects.models import Subject

pytestmark = pytest.mark.django_db


@pytest.fixture
def locker(user):
    return Subject.objects.create(owner=user, name="Maths", color="#4338ca")


def test_a_sheet_is_written_by_hand_by_default(user, locker):
    sheet = RevisionSheet.objects.create(owner=user, subject=locker, title="Suites")

    assert sheet.source == ContentSource.MANUAL


def test_a_sheet_must_belong_to_a_locker(user):
    with pytest.raises(IntegrityError):
        RevisionSheet.objects.create(owner=user, subject=None, title="Suites")


def test_the_database_rejects_an_empty_title(user, locker):
    with pytest.raises(IntegrityError):
        RevisionSheet.objects.create(owner=user, subject=locker, title="")


def test_deleting_a_locker_deletes_its_sheets(user, locker):
    RevisionSheet.objects.create(owner=user, subject=locker, title="Suites")

    locker.delete()

    assert not RevisionSheet.objects.exists()


def test_any_save_sanitizes_the_content_even_outside_the_api(user, locker):
    sheet = RevisionSheet.objects.create(
        owner=user, subject=locker, title="Admin", content="<p>ok</p><script>x</script>"
    )

    sheet.refresh_from_db()
    assert sheet.content == "<p>ok</p>"
