from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.subjects.selectors import get_locker

from .selectors import get_sheet, sheets_in
from .serializers import SheetSerializer, SheetSummarySerializer, SheetWriteSerializer
from .services import create_sheet, delete_sheet, update_sheet


class LockerSheetsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=SheetSummarySerializer(many=True))
    def get(self, request, locker_pk):
        locker = get_locker(request.user, locker_pk)
        return Response(SheetSummarySerializer(sheets_in(locker), many=True).data)

    @extend_schema(request=SheetWriteSerializer, responses={201: SheetSerializer})
    def post(self, request, locker_pk):
        locker = get_locker(request.user, locker_pk)
        serializer = SheetWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sheet = create_sheet(locker, **serializer.validated_data)
        return Response(SheetSerializer(sheet).data, status=status.HTTP_201_CREATED)


class SheetDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=SheetSerializer)
    def get(self, request, pk):
        return Response(SheetSerializer(get_sheet(request.user, pk)).data)

    @extend_schema(request=SheetWriteSerializer, responses=SheetSerializer)
    def patch(self, request, pk):
        sheet = get_sheet(request.user, pk)
        serializer = SheetWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        sheet = update_sheet(sheet, **serializer.validated_data)
        return Response(SheetSerializer(sheet).data)

    @extend_schema(responses={204: None})
    def delete(self, request, pk):
        delete_sheet(get_sheet(request.user, pk))
        return Response(status=status.HTTP_204_NO_CONTENT)
