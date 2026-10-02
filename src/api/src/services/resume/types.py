from dataclasses import dataclass
from datetime import datetime
from typing import Final

from content.base import ContentModel
from services.revalidation.types import RevalidationStatus

MAX_RESUME_BYTES: Final[int] = 10 * 1024 * 1024
PDF_CONTENT_TYPE: Final[str] = "application/pdf"


@dataclass(frozen=True, slots=True)
class ResumeFile:
    content: bytes
    etag: str
    modified_at: datetime


class SavedResume(ContentModel):
    etag: str
    size: int
    revalidation: RevalidationStatus


class ResumeNotFoundError(Exception):
    pass


class NotAPdfError(Exception):
    """The upload is not declared as `application/pdf`, or does not start with the `%PDF-` magic bytes."""


class ResumeTooLargeError(Exception):
    pass
