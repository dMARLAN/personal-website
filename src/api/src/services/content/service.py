import hashlib
import json
from collections.abc import Mapping
from datetime import UTC, datetime

from content.base import ContentModel
from content.sections import ContentSection, SectionSpec, SiteContent
from proj_logging.logger import get_logger
from repo.content import ContentRepository
from services.content.types import (
    DraftNotFoundError,
    Drafts,
    PreconditionFailedError,
    PublishedContent,
    SavedSection,
    SectionDraft,
    SectionMissingError,
    SectionState,
)
from services.revalidation.service import RevalidationService

log = get_logger(__name__)


def _etag(document: str) -> str:
    return hashlib.sha256(document.encode()).hexdigest()


class ContentService:
    """Content sections stored as validated JSON documents, one row per section."""

    def __init__(self, content_repo: ContentRepository, revalidation_service: RevalidationService) -> None:
        self.__content_repo = content_repo
        self.__revalidation_service = revalidation_service

    async def published(self) -> PublishedContent:
        rows = {row.section: row for row in await self.__content_repo.get_all()}
        if missing := [section for section in ContentSection if section not in rows]:
            raise SectionMissingError(missing[0])
        ordered = [rows[section] for section in ContentSection]
        # Each document was validated on write; validating the whole again on read fails loudly if a schema change
        # shipped without a data migration.
        content = SiteContent.model_validate_json(
            "{" + ",".join(f'"{row.section}":{row.document}' for row in ordered) + "}"
        )
        return PublishedContent(content=content, etag=_etag("".join(row.etag for row in ordered)))

    async def get[M: ContentModel](self, spec: SectionSpec[M]) -> SectionState[M]:
        row = await self.__content_repo.get(spec.section)
        if row is None:
            raise SectionMissingError(spec.section)
        return SectionState[M](
            document=spec.model.model_validate_json(row.document), etag=row.etag, updated_at=row.updated_at
        )

    async def save[M: ContentModel](self, spec: SectionSpec[M], document: M, if_match: str | None) -> SavedSection[M]:
        """Publish an already validated document, deleting the section's draft, then ask the frontend to re-render
        the section's pages."""
        text = document.model_dump_json()
        row = await self.__content_repo.publish(
            section=spec.section,
            document=text,
            etag=_etag(text),
            updated_at=datetime.now(UTC),
            if_etag=if_match,
        )
        if row is None:
            if if_match is not None and await self.__content_repo.get(spec.section) is not None:
                raise PreconditionFailedError
            raise SectionMissingError(spec.section)
        revalidation = await self.__revalidation_service.revalidate(spec.paths)
        return SavedSection[M](document=document, etag=row.etag, updated_at=row.updated_at, revalidation=revalidation)

    async def drafts(self) -> Drafts:
        # Validated on read as published documents are, so a schema change without a data migration fails loudly.
        return Drafts.model_validate(
            {
                row.section: {"content": json.loads(row.document), "updated_at": row.updated_at}
                for row in await self.__content_repo.get_drafts()
            }
        )

    async def get_draft[M: ContentModel](self, spec: SectionSpec[M]) -> SectionDraft[M]:
        row = await self.__content_repo.get_draft(spec.section)
        if row is None:
            raise DraftNotFoundError
        return SectionDraft[M](content=spec.model.model_validate_json(row.document), updated_at=row.updated_at)

    async def save_draft[M: ContentModel](self, spec: SectionSpec[M], document: M) -> SectionDraft[M]:
        """Store an already validated document as the section's draft. The site does not change, so nothing is
        revalidated."""
        row = await self.__content_repo.save_draft(
            section=spec.section, document=document.model_dump_json(), updated_at=datetime.now(UTC)
        )
        return SectionDraft[M](content=document, updated_at=row.updated_at)

    async def delete_draft(self, section: ContentSection) -> None:
        await self.__content_repo.delete_draft(section)

    async def seed_missing(self, documents: Mapping[ContentSection, ContentModel]) -> list[ContentSection]:
        """Insert the seed document for every section that has no row yet: all of them on a fresh database."""
        seeded: list[ContentSection] = []
        now = datetime.now(UTC)
        for section, document in documents.items():
            text = document.model_dump_json()
            if await self.__content_repo.insert_missing(
                section=section, document=text, etag=_etag(text), updated_at=now
            ):
                seeded.append(section)
        if seeded:
            log.info(f"Seeded content sections: {', '.join(seeded)}")
        return seeded
