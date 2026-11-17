import hashlib
from dataclasses import dataclass

from django.core.files.base import ContentFile
from django.db import transaction
from django.utils.text import slugify
from django.utils.timezone import now

from apps.accounts.models import Profile, User
from apps.billing.models import Plan, Subscription
from apps.documents.models import Document
from apps.subjects.models import Subject

from .data import DEMO_EMAILS, DEMO_STUDENTS, DemoCourse
from .pdf import build_pdf


@dataclass
class SeedReport:
    users_created: int = 0
    users_updated: int = 0
    lockers_created: int = 0
    courses_created: int = 0


def reset_demo_data() -> int:
    """Deletes the demo accounts; their lockers and courses follow (CASCADE)."""
    users = User.objects.filter(email__in=DEMO_EMAILS)
    count = users.count()
    users.delete()
    return count


@transaction.atomic
def seed_demo_data(password: str) -> SeedReport:
    """Creates or updates the demo data. Safe to run again: no duplicates."""
    report = SeedReport()

    for student in DEMO_STUDENTS:
        user, created = User.objects.get_or_create(email=student.email)
        if created:
            report.users_created += 1
        else:
            report.users_updated += 1
        user.first_name = student.first_name
        user.is_email_verified = True
        user.set_password(password)
        user.save()

        Profile.objects.update_or_create(
            user=user,
            defaults={
                "username": student.username,
                "track": student.track,
                # The onboarding will be wired later: demo accounts skip it.
                "onboarding_completed_at": now(),
            },
        )
        Subscription.objects.filter(user=user).update(
            plan=Plan.objects.get(code=student.plan_code)
        )

        for position, locker in enumerate(student.lockers):
            subject, created = Subject.objects.get_or_create(
                owner=user,
                name=locker.name,
                defaults={"color": locker.color, "position": position},
            )
            if created:
                report.lockers_created += 1
            for course in locker.courses:
                if _create_course(user, subject, course):
                    report.courses_created += 1

    return report


def _create_course(user: User, subject: Subject, course: DemoCourse) -> bool:
    """Creates the course unless it already exists. Returns True if created."""
    if Document.objects.filter(
        owner=user, subject=subject, title=course.title
    ).exists():
        return False

    content = build_pdf(course.title, course.paragraphs)
    filename = f"{slugify(course.title)}.pdf"
    Document.objects.create(
        owner=user,
        subject=subject,
        title=course.title,
        kind="course",
        file=ContentFile(content, name=filename),
        original_filename=filename,
        mime_type="application/pdf",
        size_bytes=len(content),
        sha256=hashlib.sha256(content).hexdigest(),
        page_count=1,
    )
    return True
