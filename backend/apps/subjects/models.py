from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models

from apps.core.models import TimeStampedModel

from .icons import LockerIcon

hex_color_validator = RegexValidator(r"^#[0-9A-Fa-f]{6}$", "Format attendu : #RRGGBB.")


class Subject(TimeStampedModel):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subjects"
    )
    name = models.CharField(max_length=100)
    color = models.CharField(
        max_length=7, default="#6366F1", validators=[hex_color_validator]
    )
    icon = models.CharField(
        max_length=20,
        choices=LockerIcon.choices,
        default=LockerIcon.FOLDER,
    )
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = "matière"
        ordering = ["position", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name"], name="uniq_subject_owner_name"
            ),
            models.CheckConstraint(
                condition=models.Q(icon__in=LockerIcon.values),
                name="subjects_subject_icon_valid",
            ),
        ]
        indexes = [
            models.Index(fields=["owner", "position"], name="subject_owner_pos_idx"),
        ]

    def __str__(self):
        return self.name
