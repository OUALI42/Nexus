from django.urls import include, path

from apps.core.views import health

# Each domain app will add its own urls.py here, story by story.
urlpatterns = [
    path("health/", health, name="health"),
    path("auth/", include("apps.accounts.urls")),
]