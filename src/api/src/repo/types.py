from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict


class StoredSection(BaseModel):
    """A `content_section` row. `document` is the JSON text the API validated on write."""

    model_config = ConfigDict(frozen=True)

    section: str
    document: str
    etag: str
    updated_at: datetime


class AdminSessionRecord(BaseModel):
    """An `admin_session` row."""

    model_config = ConfigDict(frozen=True)

    token_hash: str
    csrf_token: str
    created_at: datetime
    expires_at: datetime


def to_db_time(moment: datetime) -> str:
    """The stored form of a timestamp: UTC ISO 8601 with fixed microseconds, so stored values compare as text."""
    if moment.tzinfo is None:
        raise ValueError("stored timestamps must be timezone-aware")
    return moment.astimezone(UTC).isoformat(timespec="microseconds")
