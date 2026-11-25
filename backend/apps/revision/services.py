from .models import RevisionSheet


def create_sheet(locker, *, title: str, content: str = "") -> RevisionSheet:
    # The sheet always belongs to the locker's owner, never to a client value.
    return RevisionSheet.objects.create(
        owner=locker.owner, subject=locker, title=title, content=content
    )


def update_sheet(
    sheet: RevisionSheet, *, title: str | None = None, content: str | None = None
) -> RevisionSheet:
    changed = []
    if title is not None:
        sheet.title = title
        changed.append("title")
    if content is not None:
        sheet.content = content
        changed.append("content")
    if changed:
        sheet.save(update_fields=[*changed, "updated_at"])
    return sheet


def delete_sheet(sheet: RevisionSheet) -> None:
    sheet.delete()
