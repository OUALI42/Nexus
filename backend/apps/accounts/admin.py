from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import PrivacyConsent, Profile, User


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False


class PrivacyConsentInline(admin.TabularInline):
    model = PrivacyConsent
    extra = 0
    can_delete = False
    readonly_fields = ["policy_version", "accepted_at"]

    def has_add_permission(self, request, obj=None):
        return False  # consents are only created by the user


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    inlines = [ProfileInline, PrivacyConsentInline]
    list_display = [
        "email",
        "first_name",
        "last_name",
        "is_email_verified",
        "is_active",
        "is_staff",
        "date_joined",
    ]
    list_filter = ["is_active", "is_staff", "is_email_verified"]
    search_fields = ["email", "first_name", "last_name", "profile__username"]
    readonly_fields = ["last_login", "date_joined"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Identité",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "timezone",
                    "is_email_verified",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2"),
            },
        ),
    )
