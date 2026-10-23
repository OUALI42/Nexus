import hashlib

from django.contrib import admin

from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "owner",
        "subject",
        "kind",
        "status",
        "size_bytes",
        "created_at",
    ]
    list_filter = ["kind", "status"]
    search_fields = ["title", "original_filename", "owner__email"]
    readonly_fields = ["original_filename", "mime_type", "size_bytes", "sha256"]

    def save_model(self, request, obj, form, change):
        uploaded = form.cleaned_data.get("file")
        if uploaded and "file" in form.changed_data:
            digest = hashlib.sha256()
            for (
                part
            ) in uploaded.chunks():  # read by chunks: never load a whole file in memory
                digest.update(part)
            uploaded.seek(0)  # rewind so Django can save the file afterwards
            obj.sha256 = digest.hexdigest()
            obj.size_bytes = uploaded.size
            obj.mime_type = uploaded.content_type or "application/octet-stream"
            obj.original_filename = uploaded.name
        super().save_model(request, obj, form, change)
