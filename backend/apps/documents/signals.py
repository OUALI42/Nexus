from django.db import transaction
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Document


@receiver(post_delete, sender=Document)
def delete_document_file(sender, instance, **kwargs):
    """Remove the file from storage once the deletion is committed.

    Qdrant vectors cleanup will be added with the ingestion story.
    """
    if instance.file:
        storage, name = instance.file.storage, instance.file.name
        transaction.on_commit(lambda: storage.delete(name))