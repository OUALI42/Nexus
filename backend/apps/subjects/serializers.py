from rest_framework import serializers

from .colors import LockerColor
from .models import Subject
from .services import NAME_TAKEN_MESSAGE


class LockerSerializer(serializers.ModelSerializer):
    course_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Subject
        fields = ["id", "name", "color", "icon", "position", "course_count"]
        read_only_fields = fields


class LockerCreateSerializer(serializers.ModelSerializer):
    color = serializers.ChoiceField(choices=LockerColor.choices)

    class Meta:
        model = Subject
        fields = ["name", "color", "icon"]

    def validate_name(self, value: str) -> str:
        user = self.context["request"].user
        if Subject.objects.filter(owner=user, name__iexact=value).exists():
            raise serializers.ValidationError(NAME_TAKEN_MESSAGE)
        return value


class ChoiceSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class LockerChoicesSerializer(serializers.Serializer):
    colors = ChoiceSerializer(many=True)
    icons = ChoiceSerializer(many=True)
