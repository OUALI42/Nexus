from django.contrib import admin

from .models import AIJob


@admin.register(AIJob)
class AIJobAdmin(admin.ModelAdmin):
    list_display = [
        "public_id",
        "user",
        "kind",
        "status",
        "cost",
        "created_at",
        "finished_at",
    ]
    list_filter = ["kind", "status"]
    search_fields = ["public_id", "user__email"]
    readonly_fields = [
        "public_id",
        "input",
        "result",
        "error",
        "prompt_tokens",
        "completion_tokens",
    ]
