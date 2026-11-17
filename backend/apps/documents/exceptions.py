from rest_framework import status
from rest_framework.exceptions import APIException


class UploadTooLarge(APIException):
    status_code = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    default_code = "file_too_large"
    default_detail = "Ce fichier est trop volumineux."

    def __init__(self, max_size_label: str):
        super().__init__(
            f"Ce fichier dépasse la taille maximale autorisée ({max_size_label})."
        )
