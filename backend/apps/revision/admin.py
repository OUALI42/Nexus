from django.contrib import admin

from .models import RevisionSheet


@admin.register(RevisionSheet)
class RevisionSheetAdmin(admin.ModelAdmin):
    list_display = ["title", "owner", "subject", "source", "updated_at"]
    list_filter = ["source"]
    search_fields = ["title", "owner__email"]
