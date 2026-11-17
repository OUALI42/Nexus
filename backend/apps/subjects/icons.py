from django.db import models


class LockerIcon(models.TextChoices):
    """Closed list of locker icons (lucide names, drawn by the front-end)."""

    FOLDER = "folder", "Dossier"
    BOOK_OPEN = "book-open", "Livre"
    CALCULATOR = "calculator", "Calculatrice"
    SIGMA = "sigma", "Sigma"
    ATOM = "atom", "Atome"
    FLASK = "flask-conical", "Fiole"
    LEAF = "leaf", "Feuille"
    GLOBE = "globe", "Globe"
    LANDMARK = "landmark", "Monument"
    LANGUAGES = "languages", "Langues"
    PEN = "pen-line", "Plume"
    TRENDING_UP = "trending-up", "Courbe"
    SCALE = "scale", "Balance"
    CODE = "code", "Code"
    PALETTE = "palette", "Palette"
    MUSIC = "music", "Musique"
