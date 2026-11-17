from django.urls import path

from .views import CourseFileView

app_name = "courses"

urlpatterns = [
    path("<int:pk>/file/", CourseFileView.as_view(), name="file"),
]
