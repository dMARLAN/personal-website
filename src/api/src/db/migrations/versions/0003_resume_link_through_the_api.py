"""resume link through the api

The resume PDF moved from the frontend's public/ folder to the API (`GET /api/resume.pdf`). Stored links that point at
the old `/resume.pdf` path now point at the API's.

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-02 13:40:00.000000
"""

import hashlib
import json
from collections.abc import Sequence
from typing import Final, TypedDict

import sqlalchemy as sa
from alembic import op


revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_OLD_URL: Final[str] = "/resume.pdf"
_NEW_URL: Final[str] = "/api/resume.pdf"


class _Links(TypedDict):
    links: list[dict[str, str]]


def _repoint(old_url: str, new_url: str) -> None:
    connection = op.get_bind()
    row = connection.execute(sa.text("SELECT document FROM content_section WHERE section = 'links'")).one_or_none()
    if row is None:
        # A fresh database: the API seeds the links section after migrating.
        return
    links: _Links = json.loads(row.document)
    for link in links["links"]:
        if link["url"] == old_url:
            link["url"] = new_url
    # The same compact JSON Pydantic's model_dump_json writes, so the ETag matches what a save would store.
    document = json.dumps(links, separators=(",", ":"), ensure_ascii=False)
    connection.execute(
        sa.text("UPDATE content_section SET document = :document, etag = :etag WHERE section = 'links'"),
        {"document": document, "etag": hashlib.sha256(document.encode()).hexdigest()},
    )


def upgrade() -> None:
    _repoint(_OLD_URL, _NEW_URL)


def downgrade() -> None:
    _repoint(_NEW_URL, _OLD_URL)
