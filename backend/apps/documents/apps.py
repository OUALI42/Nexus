from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    name = "apps.documents"
    verbose_name = "Documents"

    def ready(self):
        from . import signals  # noqa: F401
