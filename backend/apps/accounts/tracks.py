from django.db import models


class Track(models.TextChoices):
    # Classes préparatoires
    MPSI = "mpsi", "MPSI"
    MP2I = "mp2i", "MP2I"
    PCSI = "pcsi", "PCSI"
    PTSI = "ptsi", "PTSI"
    TSI = "tsi", "TSI"
    BCPST = "bcpst", "BCPST"
    TB = "tb", "TB"
    ECG = "ecg", "ECG"
    ECT = "ect", "ECT"
    HK_AL = "hk_al", "Hypokhâgne / Khâgne A/L"
    HK_BL = "hk_bl", "Hypokhâgne / Khâgne B/L"
    # Autres études
    BTS = "bts", "BTS"
    BUT = "but", "BUT"
    LICENCE = "licence", "Licence"
    MASTER = "master", "Master"
    ENGINEERING_SCHOOL = "engineering_school", "École d'ingénieurs"
    BUSINESS_SCHOOL = "business_school", "École de commerce"
    OTHER = "other", "Autre"


# Groups shown in the registration form (<optgroup>).
TRACK_GROUPS: dict[str, list[Track]] = {
    "Classes préparatoires": [
        Track.MPSI,
        Track.MP2I,
        Track.PCSI,
        Track.PTSI,
        Track.TSI,
        Track.BCPST,
        Track.TB,
        Track.ECG,
        Track.ECT,
        Track.HK_AL,
        Track.HK_BL,
    ],
    "Autres études": [
        Track.BTS,
        Track.BUT,
        Track.LICENCE,
        Track.MASTER,
        Track.ENGINEERING_SCHOOL,
        Track.BUSINESS_SCHOOL,
        Track.OTHER,
    ],
}
