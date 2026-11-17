from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .colors import LockerColor
from .icons import LockerIcon
from .selectors import get_locker, lockers_for
from .serializers import (
    LockerChoicesSerializer,
    LockerCreateSerializer,
    LockerSerializer,
)
from .services import create_locker


class LockerListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=LockerSerializer(many=True))
    def get(self, request):
        return Response(LockerSerializer(lockers_for(request.user), many=True).data)

    @extend_schema(request=LockerCreateSerializer, responses={201: LockerSerializer})
    def post(self, request):
        serializer = LockerCreateSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        locker = create_locker(request.user, **serializer.validated_data)
        # Re-read through the selector to get the annotated course_count.
        data = LockerSerializer(get_locker(request.user, locker.pk)).data
        return Response(data, status=status.HTTP_201_CREATED)


class LockerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=LockerSerializer)
    def get(self, request, pk):
        return Response(LockerSerializer(get_locker(request.user, pk)).data)


class LockerChoicesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=LockerChoicesSerializer)
    def get(self, request):
        data = {
            "colors": [{"value": v, "label": l} for v, l in LockerColor.choices],
            "icons": [{"value": v, "label": l} for v, l in LockerIcon.choices],
        }
        return Response(LockerChoicesSerializer(data).data)
