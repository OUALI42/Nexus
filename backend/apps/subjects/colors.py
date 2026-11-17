from django.db import models


class LockerColor(models.TextChoices):
    """Locker colors; each one reaches a 4.5:1 contrast ratio with white text (WCAG AA)."""

    INDIGO = "#4338ca", "Indigo"
    BLUE = "#1d4ed8", "Bleu"
    CYAN = "#0e7490", "Cyan"
    TEAL = "#0f766e", "Sarcelle"
    GREEN = "#166534", "Vert"
    AMBER = "#b45309", "Ambre"
    ORANGE = "#c2410c", "Orange"
    RED = "#b91c1c", "Rouge"
    RASPBERRY = "#9d174d", "Framboise"
    PINK = "#be185d", "Rose"
    VIOLET = "#6d28d9", "Violet"
    SLATE = "#475569", "Ardoise"
