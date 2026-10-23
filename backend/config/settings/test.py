from .base import *

# Fast hashing: Argon2 is deliberately slow, irrelevant in tests.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

DATABASES["default"]["TEST"] = {
    "CHARSET": "utf8mb4",
    "COLLATION": "utf8mb4_0900_ai_ci",
}