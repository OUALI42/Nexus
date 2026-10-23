from django.urls import path

from .views import CsrfTokenView

app_name = "accounts"

urlpatterns = [
    path("csrf/", CsrfTokenView.as_view(), name="csrf"),
]