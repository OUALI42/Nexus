from django.contrib import admin

from .models import Event, Reminder


class ReminderInline(admin.TabularInline):
    model = Reminder
    extra = 0


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["title", "owner", "subject", "kind", "starts_at"]
    list_filter = ["kind"]
    search_fields = ["title", "owner__email"]
    inlines = [ReminderInline]
