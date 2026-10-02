from datetime import datetime
from typing import Final

from sqlalchemy import text

from repo.base import Repository
from repo.types import StoredDraft, StoredSection, to_db_time

_COLUMNS: Final[str] = "section, document, etag, updated_at"
_DRAFT_COLUMNS: Final[str] = "section, document, updated_at"


class ContentRepository(Repository):
    async def get_all(self) -> list[StoredSection]:
        async with self.transaction() as session:
            result = await session.execute(text(f"SELECT {_COLUMNS} FROM content_section ORDER BY section"))
            return [StoredSection.model_validate(row, from_attributes=True) for row in result]

    async def get(self, section: str) -> StoredSection | None:
        async with self.transaction() as session:
            result = await session.execute(
                text(f"SELECT {_COLUMNS} FROM content_section WHERE section = :section"), {"section": section}
            )
            if row := result.one_or_none():
                return StoredSection.model_validate(row, from_attributes=True)
            return None

    async def publish(  # noqa: PLR0913
        self,
        *,
        section: str,
        document: str,
        etag: str,
        updated_at: datetime,
        if_etag: str | None,
    ) -> StoredSection | None:
        """Publish a section's document and delete its draft, in one transaction.

        With `if_etag`, only if the stored ETag still matches; else changes nothing and returns None.
        """
        async with self.transaction() as session:
            result = await session.execute(
                text(f"""
                    UPDATE content_section
                    SET document = :document, etag = :etag, updated_at = :updated_at
                    WHERE section = :section AND (:if_etag IS NULL OR etag = :if_etag)
                    RETURNING {_COLUMNS}
                """),
                {
                    "section": section,
                    "document": document,
                    "etag": etag,
                    "updated_at": to_db_time(updated_at),
                    "if_etag": if_etag,
                },
            )
            if (row := result.one_or_none()) is None:
                return None
            await session.execute(text("DELETE FROM content_draft WHERE section = :section"), {"section": section})
            return StoredSection.model_validate(row, from_attributes=True)

    async def insert_missing(self, *, section: str, document: str, etag: str, updated_at: datetime) -> bool:
        """Insert a section unless it already has a row. Returns whether it inserted."""
        async with self.transaction() as session:
            result = await session.execute(
                text("""
                    INSERT INTO content_section (section, document, etag, updated_at)
                    VALUES (:section, :document, :etag, :updated_at)
                    ON CONFLICT (section) DO NOTHING
                    RETURNING section
                """),
                {"section": section, "document": document, "etag": etag, "updated_at": to_db_time(updated_at)},
            )
            return result.one_or_none() is not None

    async def get_drafts(self) -> list[StoredDraft]:
        async with self.transaction() as session:
            result = await session.execute(text(f"SELECT {_DRAFT_COLUMNS} FROM content_draft ORDER BY section"))
            return [StoredDraft.model_validate(row, from_attributes=True) for row in result]

    async def get_draft(self, section: str) -> StoredDraft | None:
        async with self.transaction() as session:
            result = await session.execute(
                text(f"SELECT {_DRAFT_COLUMNS} FROM content_draft WHERE section = :section"), {"section": section}
            )
            if row := result.one_or_none():
                return StoredDraft.model_validate(row, from_attributes=True)
            return None

    async def save_draft(self, *, section: str, document: str, updated_at: datetime) -> StoredDraft:
        """Insert the section's draft, or replace the one it has."""
        async with self.transaction() as session:
            result = await session.execute(
                text(f"""
                    INSERT INTO content_draft (section, document, updated_at)
                    VALUES (:section, :document, :updated_at)
                    ON CONFLICT (section) DO UPDATE SET document = excluded.document, updated_at = excluded.updated_at
                    RETURNING {_DRAFT_COLUMNS}
                """),
                {"section": section, "document": document, "updated_at": to_db_time(updated_at)},
            )
            return StoredDraft.model_validate(result.one(), from_attributes=True)

    async def delete_draft(self, section: str) -> None:
        async with self.transaction() as session:
            await session.execute(text("DELETE FROM content_draft WHERE section = :section"), {"section": section})
