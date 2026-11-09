from rest_framework import status
from rest_framework.exceptions import APIException


class InvalidVerificationToken(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "token_invalid"
    default_detail = (
        "Ce lien de vérification n'est pas valide. Demande un nouveau lien."
    )


class UsedVerificationToken(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "token_used"
    default_detail = (
        "Ce lien a déjà été utilisé. Ton adresse est sans doute déjà vérifiée : "
        "essaie de te connecter."
    )


class ExpiredVerificationToken(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "token_expired"
    default_detail = "Ce lien a expiré. Demande un nouveau lien."
