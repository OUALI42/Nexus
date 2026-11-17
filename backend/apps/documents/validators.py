import hashlib

PDF_SIGNATURE = b"%PDF-"


def has_pdf_signature(file) -> bool:
    """Check the magic bytes: the extension and the client Content-Type can be forged."""
    file.seek(0)
    header = file.read(len(PDF_SIGNATURE))
    file.seek(0)
    return header == PDF_SIGNATURE


def sha256_of(file) -> str:
    digest = hashlib.sha256()
    file.seek(0)
    for chunk in file.chunks():
        digest.update(chunk)
    file.seek(0)
    return digest.hexdigest()


def format_size(size: int) -> str:
    return f"{size // (1024 * 1024)} Mo"
