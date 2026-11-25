from django.urls import path

from apps.documents.views import LockerCoursesView
from apps.revision.views import LockerSheetsView

from .views import LockerChoicesView, LockerDetailView, LockerListCreateView

app_name = "lockers"

urlpatterns = [
    path("", LockerListCreateView.as_view(), name="list"),
    path("choices/", LockerChoicesView.as_view(), name="choices"),
    path("<int:pk>/", LockerDetailView.as_view(), name="detail"),
    path("<int:locker_pk>/courses/", LockerCoursesView.as_view(), name="courses"),
    path("<int:locker_pk>/sheets/", LockerSheetsView.as_view(), name="sheets"),
]
