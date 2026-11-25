from django.urls import path

from .views import SheetDetailView

app_name = "sheets"

urlpatterns = [
    path("<int:pk>/", SheetDetailView.as_view(), name="detail"),
]
