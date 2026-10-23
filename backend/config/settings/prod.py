from .base import *  # noqa: F403

DEBUG = False

# The app will run behind a reverse proxy that terminates HTTPS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# API docs are restricted to staff in production (log in through the admin first)
SPECTACULAR_SETTINGS["SERVE_PERMISSIONS"] = ["rest_framework.permissions.IsAdminUser"]