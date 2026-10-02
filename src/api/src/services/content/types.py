from dataclasses import dataclass
from datetime import datetime
from pydantic import Field
from pydantic.json_schema import SkipJsonSchema

from content.base import ContentModel
from content.bit import Bit
from content.checklist import Checklist
from content.contact import Contact
from content.fcs import FlightControls
from content.fuel import FuelReserves
from content.links import Links
from content.mumi import MissionData
from content.profile import Profile
from content.projects import Projects
from content.radar import RadarScene
from content.resume import Resume
from content.sections import ContentSection, SiteContent
from content.server import ServerStats
from content.work import Work
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


class SectionDraft[M: ContentModel](ContentModel):
    """A section's unpublished edit. Only preview renders it; publishing the section deletes it."""

    content: M
    updated_at: datetime


def _absent(draft: SectionDraft[ContentModel] | None) -> bool:
    return draft is None


class Drafts(ContentModel):
    """Every section that has a draft, keyed as `GET /api/content` keys sections.

    A section without a draft is left out of the JSON rather than sent as null, so the schema has no null.
    """

    profile: SectionDraft[Profile] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    resume: SectionDraft[Resume] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    work: SectionDraft[Work] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    projects: SectionDraft[Projects] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    contact: SectionDraft[Contact] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    links: SectionDraft[Links] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    server: SectionDraft[ServerStats] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    fuel: SectionDraft[FuelReserves] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    fcs: SectionDraft[FlightControls] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    checklist: SectionDraft[Checklist] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    bit: SectionDraft[Bit] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    radar: SectionDraft[RadarScene] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)
    mumi: SectionDraft[MissionData] | SkipJsonSchema[None] = Field(default=None, exclude_if=_absent)


class SectionMissingError(RuntimeError):
    """A section has no stored document. Startup seeds every section, so this means the database was changed by hand."""

    def __init__(self, section: ContentSection) -> None:
        super().__init__(f"content section {section!r} has no stored document")


class PreconditionFailedError(Exception):
    """`If-Match` named an ETag the section no longer has: someone saved it since it was loaded."""


class DraftNotFoundError(Exception):
    """The section has no draft."""
