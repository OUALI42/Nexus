from rest_framework import serializers

from .models import Document
from .validators import format_size, has_pdf_signature


class CourseSerializer(serializers.ModelSerializer):
    analysis_status = serializers.CharField(source="status", read_only=True)

    class Meta:
        model = Document
        fields = ["id", "title", "size_bytes", "analysis_status", "created_at"]
        read_only_fields = fields


class CourseUploadSerializer(serializers.Serializer):
    file = serializers.FileField(allow_empty_file=False)

    def validate_file(self, file):
        max_size = self.context["max_size"]
        if file.size > max_size:
            raise serializers.ValidationError(
                f"Ce fichier dépasse la taille maximale autorisée ({format_size(max_size)})."
            )
        if not has_pdf_signature(file):
            raise serializers.ValidationError("Ce fichier n'est pas un PDF.")
        return file
