import DOMPurify from "dompurify";

// Same allowlist as the server (apps/revision/sanitizer.py): defence in depth.
const ALLOWED_TAGS = [
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
];

export function safeSheetHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "rel"],
  });
}
