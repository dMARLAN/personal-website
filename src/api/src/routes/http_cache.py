"""ETag helpers for the HTTP layer. Services hand out bare sha256 hex digests; on the wire they are quoted."""

from typing import Final

# Public responses: caches may keep a copy but must check the ETag before each use, so an admin save shows at once.
PUBLIC_CACHE_CONTROL: Final[str] = "public, no-cache"


def quote_etag(etag: str) -> str:
    return f'"{etag}"'


def _tags(header: str) -> set[str]:
    return {tag.strip().removeprefix("W/").strip('"') for tag in header.split(",")}


def matches_if_none_match(header: str | None, etag: str) -> bool:
    """Whether a conditional GET can answer 304 Not Modified."""
    if header is None:
        return False
    tags = _tags(header)
    return "*" in tags or etag in tags


def if_match_etag(header: str | None) -> str | None:
    """The one ETag an admin save is conditional on. Accepts it quoted (as sent in `ETag`) or bare."""
    if header is None:
        return None
    return header.strip().strip('"')
