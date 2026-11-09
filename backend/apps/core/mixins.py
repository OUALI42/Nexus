from rest_framework.authentication import SessionAuthentication


class CsrfProtectedMixin:
    """
    DRF only enforces CSRF for authenticated users. Views reachable while
    logged out (register, login) must enforce it explicitly, otherwise an
    attacker's site could submit them in the victim's browser (login CSRF).
    """

    def initial(self, request, *args, **kwargs):
        SessionAuthentication().enforce_csrf(request)
        super().initial(request, *args, **kwargs)
