from rest_framework import serializers

from .models import RevisionSheet

# Raw HTML sent by the editor; about 50 pages of formatted text.
MAX_CONTENT_LENGTH = 100_000


class SheetSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = RevisionSheet
        fields = ["id", "title", "created_at", "updated_at"]
        read_only_fields = fields


class SheetSerializer(serializers.ModelSerializer):
    locker_id = serializers.IntegerField(source="subject_id", read_only=True)

    class Meta:
        model = RevisionSheet
        fields = [
            "id",
            "locker_id",
            "title",
            "content",
            "source",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class SheetWriteSerializer(serializers.Serializer):
    title = serializers.CharField(
        max_length=255,
        error_messages={
            "blank": "Donne un titre à ta fiche.",
            "required": "Donne un titre à ta fiche.",
        },
    )
    content = serializers.CharField(
        max_length=MAX_CONTENT_LENGTH,
        allow_blank=True,
        required=False,
        # Whitespace is part of the HTML: the sanitizer handles it.
        trim_whitespace=False,
    )
