from pathlib import Path

from .models import Document
from .validators import sha256_of

MAX_TITLE_LENGTH = 255
PDF_MIME_TYPE = "application/pdf"


def title_from(filename: str) -> str:
    """Display title: the original name without its extension (never used on disk)."""
    return Path(filename).stem.strip()[:MAX_TITLE_LENGTH] or "Cours sans titre"


def upload_course(locker, uploaded) -> Document:
    original_max = Document._meta.get_field("original_filename").max_length
    document = Document(
        owner=locker.owner,
        subject=locker,
        title=title_from(uploaded.name),
        original_filename=Path(uploaded.name).name[:original_max],
        # Proven by the signature check, not taken from the client.
        mime_type=PDF_MIME_TYPE,
        size_bytes=uploaded.size,
        sha256=sha256_of(uploaded),
        kind="course",
    )
    # upload_to (S1) replaces the name with a random UUID.
    document.file.save(uploaded.name, uploaded, save=False)
    try:
        document.save()
    except Exception:
        # The file is already on disk: don't leave an orphan behind.
        document.file.delete(save=False)
        raise
    return document
