from django.contrib import admin

from .models import Plan, Subscription


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ["name", "code", "monthly_price_cents", "monthly_ai_credits", "is_active"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ["user", "plan", "status", "started_at", "current_period_end"]
    list_filter = ["plan", "status"]
    search_fields = ["user__email"]
    autocomplete_fields = ["user"]