from django.conf import settings
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.validators import RegexValidator
from django.db import models
from django.db.models.functions import Lower
from django.utils.timezone import now

from apps.core.models import TimeStampedModel

from .tracks import Track


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("The email address must be set.")
        # Lowercase the whole address to avoid duplicates such as Emma@ / emma@
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if not extra_fields["is_staff"] or not extra_fields["is_superuser"]:
            raise ValueError("Superuser must have is_staff=True and is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField("e-mail", unique=True)
    first_name = models.CharField("prénom", max_length=150, blank=True)
    last_name = models.CharField("nom", max_length=150, blank=True)
    timezone = models.CharField("fuseau horaire", max_length=64, default="Europe/Paris")
    is_email_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "utilisateur"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


username_validator = RegexValidator(
    regex=r"^[a-zA-Z0-9_.-]{3,30}$",
    message=(
        "Le nom d'utilisateur doit contenir de 3 à 30 caractères : "
        "lettres sans accent, chiffres, points, tirets ou tirets bas."
    ),
)


class Profile(TimeStampedModel):
    """Public identity of a user. The plan lives in billing.Subscription."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    username = models.CharField(max_length=30, validators=[username_validator])
    track = models.CharField(max_length=30, choices=Track.choices)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                Lower("username"),
                name="accounts_profile_username_ci_unique",
                violation_error_message="Ce nom d'utilisateur est déjà pris.",
            ),
        ]

    def __str__(self):
        return self.username


class PrivacyConsent(models.Model):
    """Proof that a user accepted a given version of the privacy policy."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="privacy_consents",
    )
    policy_version = models.CharField(max_length=20)
    accepted_at = models.DateTimeField(default=now)

    class Meta:
        ordering = ["-accepted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "policy_version"],
                name="accounts_privacyconsent_user_version_unique",
            ),
        ]

    def __str__(self):
        return f"{self.user} — v{self.policy_version}"
