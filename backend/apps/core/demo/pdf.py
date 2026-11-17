"""Minimal one-page PDF generator for demo courses (no dependency)."""

import textwrap

MAX_LINES = 45  # what fits on one A4 page at this font size
WRAP_WIDTH = 85


def _pdf_string(text: str) -> bytes:
    escaped = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    # WinAnsi (cp1252) covers French accents with the standard fonts.
    return b"(" + escaped.encode("cp1252", errors="replace") + b")"


def build_pdf(title: str, paragraphs: list[str]) -> bytes:
    """Returns the bytes of a valid one-page A4 PDF."""
    lines: list[str] = []
    for paragraph in paragraphs:
        lines.extend(textwrap.wrap(paragraph, width=WRAP_WIDTH))
        lines.append("")

    content = b"BT /F2 18 Tf 56 780 Td " + _pdf_string(title) + b" Tj ET\n"
    content += b"BT /F1 11 Tf 15 TL 56 748 Td\n"
    for line in lines[:MAX_LINES]:
        content += _pdf_string(line) + b" Tj T*\n"
    content += b"ET\n"

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica "
        b"/Encoding /WinAnsiEncoding >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold "
        b"/Encoding /WinAnsiEncoding >>",
        b"<< /Length "
        + str(len(content)).encode()
        + b" >>\nstream\n"
        + content
        + b"endstream",
    ]

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"

    xref_offset = len(pdf)
    pdf += f"xref\n0 {len(objects) + 1}\n".encode()
    pdf += b"0000000000 65535 f \n"
    for offset in offsets:
        pdf += f"{offset:010d} 00000 n \n".encode()
    pdf += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_offset}\n%%EOF\n"
    ).encode()
    return bytes(pdf)
