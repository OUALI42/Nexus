from django.conf import settings
from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

from apps.accounts.models import User
from apps.core.demo.data import DEMO_STUDENTS
from apps.core.demo.seed import reset_demo_data, seed_demo_data


class Command(BaseCommand):
    help = "Creates demo students with lockers and sample PDF courses (dev only)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete the demo accounts and their data before seeding.",
        )

    def handle(self, *args, **options):
        if not (settings.ALLOW_DEMO_SEED and settings.DEBUG):
            raise CommandError(
                "seed_demo only runs in development "
                "(ALLOW_DEMO_SEED and DEBUG must both be enabled)."
            )

        password = settings.DEMO_ACCOUNT_PASSWORD
        if not password:
            raise CommandError(
                "DEMO_ACCOUNT_PASSWORD is empty: set it in your local .env file."
            )
        self._check_password_strength(password)

        if options["reset"]:
            deleted = reset_demo_data()
            self.stdout.write(f"{deleted} demo account(s) deleted.")

        report = seed_demo_data(password)

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo data ready: {report.users_created} account(s) created, "
                f"{report.users_updated} updated, {report.lockers_created} "
                f"locker(s) and {report.courses_created} course(s) created."
            )
        )
        self.stdout.write("Log in with one of these emails and DEMO_ACCOUNT_PASSWORD:")
        for student in DEMO_STUDENTS:
            self.stdout.write(f"  - {student.email}")

    def _check_password_strength(self, password: str) -> None:
        """Same rules as a real sign-up: no weak password, even for demos."""
        for student in DEMO_STUDENTS:
            try:
                password_validation.validate_password(
                    password, user=User(email=student.email)
                )
            except ValidationError as exc:
                raise CommandError(
                    "DEMO_ACCOUNT_PASSWORD is too weak: " + " ".join(exc.messages)
                ) from exc
