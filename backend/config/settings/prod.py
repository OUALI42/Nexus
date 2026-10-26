from .base import *  # noqa: F403

DEBUG = False

# The app will run behind a reverse proxy that terminates HTTPS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True  # header only; submission to the preload list is manual
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True


# API docs are restricted to staff in production (log in through the admin first)
SPECTACULAR_SETTINGS["SERVE_PERMISSIONS"] = ["rest_framework.permissions.IsAdminUser"]
