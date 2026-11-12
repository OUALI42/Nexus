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


class InvalidCredentials(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_code = "invalid_credentials"
    default_detail = (
        "Identifiants invalides. Vérifie ton adresse e-mail et ton mot de passe."
    )


class EmailNotVerified(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = "email_not_verified"
    default_detail = (
        "Confirme d'abord ton adresse e-mail grâce au lien reçu à l'inscription."
    )
