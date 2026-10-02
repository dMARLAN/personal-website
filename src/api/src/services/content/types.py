from dataclasses import dataclass
from datetime import datetime

from content.base import ContentModel
from content.sections import ContentSection, SiteContent
from services.revalidation.types import RevalidationStatus


@dataclass(frozen=True, slots=True)
class PublishedContent:
    content: SiteContent
    # Changes whenever any section changes.
    etag: str


class SectionState[M: ContentModel](ContentModel):
    """A section as the admin edits it. Send `etag` back as `If-Match` to refuse a save over someone else's."""

    document: M
    etag: str
    updated_at: datetime


class SavedSection[M: ContentModel](ContentModel):
    """A saved section, and whether the site re-rendered it."""

    document: M
    etag: str
    updated_at: datetime
    revalidation: RevalidationStatus


class SectionMissingError(RuntimeError):
    """A section has no stored document. Startup seeds every section, so this means the database was changed by hand."""

    def __init__(self, section: ContentSection) -> None:
        super().__init__(f"content section {section!r} has no stored document")


class PreconditionFailedError(Exception):
    """`If-Match` named an ETag the section no longer has: someone saved it since it was loaded."""
