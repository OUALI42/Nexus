from django.urls import path

from apps.core.views import health

# Each domain app will add its own urls.py here, story by story.
urlpatterns = [
    path("health/", health, name="health"),
]