from django.conf import settings
from django.contrib.auth import password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from rest_framework import serializers

from .models import Profile, User, username_validator
from .services import register_user
from .tracks import Track

RESERVED_USERNAMES = {"admin", "administrateur", "nexus", "support", "moderateur"}

DUPLICATE_MESSAGES = {
    "email": "Un compte existe déjà avec cet e-mail.",
    "username": "Ce nom d'utilisateur est déjà pris.",
}


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
        style={"input_type": "password"},
    )
    username = serializers.CharField(max_length=30, validators=[username_validator])
    track = serializers.ChoiceField(choices=Track.choices)
    privacy_policy_accepted = serializers.BooleanField(write_only=True)
    privacy_policy_version = serializers.CharField(write_only=True, max_length=20)

    def validate_email(self, value: str) -> str:
        email = value.lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(DUPLICATE_MESSAGES["email"])
        return email

    def validate_username(self, value: str) -> str:
        if value.lower() in RESERVED_USERNAMES:
            raise serializers.ValidationError("Ce nom d'utilisateur est réservé.")
        if Profile.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(DUPLICATE_MESSAGES["username"])
        return value

    def validate_password(self, value: str) -> str:
        # Unsaved user: lets Django reject a password too close to the email.
        user = User(email=str(self.initial_data.get("email", "")))
        try:
            password_validation.validate_password(value, user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages)) from exc
        return value

    def validate_privacy_policy_accepted(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError(
                "Tu dois accepter la politique de confidentialité pour créer un compte."
            )
        return value

    def validate_privacy_policy_version(self, value: str) -> str:
        if value != settings.PRIVACY_POLICY_VERSION:
            raise serializers.ValidationError(
                "La politique de confidentialité a changé. "
                "Recharge la page pour lire la nouvelle version."
            )
        return value

    def create(self, validated_data: dict) -> User:
        try:
            return register_user(
                email=validated_data["email"],
                password=validated_data["password"],
                username=validated_data["username"],
                track=validated_data["track"],
                policy_version=validated_data["privacy_policy_version"],
            )
        except IntegrityError as exc:
            # Two sign-ups racing for the same email or username.
            field = "username" if "username" in str(exc) else "email"
            raise serializers.ValidationError(
                {field: [DUPLICATE_MESSAGES[field]]}
            ) from exc

    def to_representation(self, user: User) -> dict:
        return {
            "email": user.email,
            "username": user.profile.username,
            "track": user.profile.track,
        }


class TrackGroupSerializer(serializers.Serializer):
    label = serializers.CharField()
    options = serializers.ListField(child=serializers.DictField())


class PrivacyPolicySerializer(serializers.Serializer):
    version = serializers.CharField()
