from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse


def lockout_response(
    request: HttpRequest,
    original_response: HttpResponse | None = None,
    credentials: dict | None = None,
) -> JsonResponse:
    """
    Neutral lockout answer in the unified error format. It is the same whether
    the email exists or not, so it reveals nothing about registered accounts.
    """
    cooloff_seconds = int(settings.AXES_COOLOFF_TIME.total_seconds())
    minutes = cooloff_seconds // 60
    response = JsonResponse(
        {
            "error": {
                "code": "too_many_attempts",
                "message": (
                    "Trop de tentatives de connexion. "
                    f"Réessaie dans {minutes} minutes."
                ),
            }
        },
        status=429,
    )
    response["Retry-After"] = str(cooloff_seconds)
    return response
