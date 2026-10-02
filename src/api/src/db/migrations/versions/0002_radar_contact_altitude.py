"""radar contact altitude

Each radar contact gained `altitude` (feet), which the frontend's elevation bars use to decide which scans see it.
Stored radar documents get the ownship's altitude for every contact that lacks one: a contact level with us is seen by
the default scan, so the page looks as it did before.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-02 13:10:00.000000
"""

import hashlib
import json
from collections.abc import Sequence
from typing import TypedDict

import sqlalchemy as sa
from alembic import op


revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


class _Ownship(TypedDict):
    altitude: int


class _RadarScene(TypedDict):
    """The keys this migration touches. The stored document has more, which pass through unchanged."""

    ownship: _Ownship
    contacts: list[dict[str, float]]


def _load_radar(connection: sa.Connection) -> _RadarScene | None:
    row = connection.execute(sa.text("SELECT document FROM content_section WHERE section = 'radar'")).one_or_none()
    # None on a fresh database: the API seeds the radar section after migrating.
    return None if row is None else json.loads(row.document)


def _store_radar(connection: sa.Connection, scene: _RadarScene) -> None:
    # The same compact JSON Pydantic's model_dump_json writes, so the ETag matches what a save would store.
    document = json.dumps(scene, separators=(",", ":"), ensure_ascii=False)
    connection.execute(
        sa.text("UPDATE content_section SET document = :document, etag = :etag WHERE section = 'radar'"),
        {"document": document, "etag": hashlib.sha256(document.encode()).hexdigest()},
    )


def upgrade() -> None:
    connection = op.get_bind()
    if (scene := _load_radar(connection)) is None:
        return
    for contact in scene["contacts"]:
        contact.setdefault("altitude", scene["ownship"]["altitude"])
    _store_radar(connection, scene)


def downgrade() -> None:
    connection = op.get_bind()
    if (scene := _load_radar(connection)) is None:
        return
    for contact in scene["contacts"]:
        contact.pop("altitude", None)
    _store_radar(connection, scene)
