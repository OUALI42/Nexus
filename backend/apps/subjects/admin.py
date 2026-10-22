from django.contrib import admin

from .models import Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "color", "position"]
    search_fields = ["name", "owner__email"]