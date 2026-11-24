import nh3

# Exactly what the sheet editor can produce: anything else is removed.
ALLOWED_TAGS = {
    "p",
    "br",
    "h2",
    "h3",
    "strong",
    "em",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "hr",
    "a",
}
ALLOWED_ATTRIBUTES = {"a": {"href"}}
ALLOWED_URL_SCHEMES = {"http", "https", "mailto"}
LINK_REL = "noopener noreferrer nofollow"


def sanitize_sheet_html(html: str) -> str:
    """Keep only the formatting of the sheet editor (allowlist, never a blocklist)."""
    return nh3.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        url_schemes=ALLOWED_URL_SCHEMES,
        link_rel=LINK_REL,
        strip_comments=True,
    ).strip()
