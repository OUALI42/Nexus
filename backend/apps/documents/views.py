import logging

from django.http import FileResponse
from django.utils.cache import patch_cache_control
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.billing.selectors import max_upload_size_for
from apps.subjects.selectors import get_locker

from .exceptions import UploadTooLarge
from .selectors import courses_in, get_course
from .serializers import CourseSerializer, CourseUploadSerializer
from .services import PDF_MIME_TYPE, upload_course
from .validators import format_size

logger = logging.getLogger(__name__)
# Multipart boundaries and headers add a few bytes around the file itself.
MULTIPART_OVERHEAD = 64 * 1024


def _content_length(request) -> int:
    try:
        return max(int(request.META.get("CONTENT_LENGTH") or 0), 0)
    except ValueError:
        return 0


class LockerCoursesView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    @extend_schema(responses=CourseSerializer(many=True))
    def get(self, request, locker_pk):
        locker = get_locker(request.user, locker_pk)
        return Response(CourseSerializer(courses_in(locker), many=True).data)

    @extend_schema(request=CourseUploadSerializer, responses={201: CourseSerializer})
    def post(self, request, locker_pk):
        locker = get_locker(request.user, locker_pk)
        max_size = max_upload_size_for(request.user)

        # Reject before the body is read: DRF parses it lazily on request.data.
        if _content_length(request) > max_size + MULTIPART_OVERHEAD:
            raise UploadTooLarge(format_size(max_size))

        serializer = CourseUploadSerializer(
            data=request.data, context={"request": request, "max_size": max_size}
        )
        serializer.is_valid(raise_exception=True)
        course = upload_course(locker, serializer.validated_data["file"])
        return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)


class CourseFileView(APIView):
    permission_classes = [IsAuthenticated]

    def perform_content_negotiation(self, request, force=False):
        # A browser may send "Accept: application/pdf": never answer 406 here.
        return super().perform_content_negotiation(request, force=True)

    @extend_schema(responses={(200, "application/pdf"): OpenApiTypes.BINARY})
    def get(self, request, pk):
        course = get_course(request.user, pk)
        try:
            file = course.file.open("rb")
        except FileNotFoundError as exc:
            logger.error("Course file missing on disk", extra={"course_id": course.pk})
            raise NotFound("Ce cours est introuvable.") from exc

        response = FileResponse(
            file,
            content_type=PDF_MIME_TYPE,
            as_attachment=request.query_params.get("download") == "1",
            filename=course.original_filename or f"{course.title}.pdf",
        )
        # Personal documents: never kept by a shared cache or proxy.
        patch_cache_control(response, private=True, no_store=True)
        return response
