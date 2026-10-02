from unittest.mock import AsyncMock, create_autospec

import pytest

from content.profile import Profile
from content.sections import LINKS, PROFILE, ContentSection
from db.database import DatabaseContext
from repo.content import ContentRepository
from seed.content import SEED_DOCUMENTS
from services.content.service import ContentService
from services.content.types import PreconditionFailedError, SectionMissingError
from services.revalidation.service import RevalidationService
from services.revalidation.types import RevalidationStatus


def make_revalidation(status: RevalidationStatus = RevalidationStatus.DONE) -> AsyncMock:
    revalidation = create_autospec(RevalidationService, instance=True)
    revalidation.revalidate = AsyncMock(return_value=status)
    return revalidation


async def make_service(db_ctx: DatabaseContext, revalidation: AsyncMock) -> ContentService:
    service = ContentService(ContentRepository(db_ctx), revalidation)
    await service.seed_missing(SEED_DOCUMENTS)
    return service


def seed_profile() -> Profile:
    profile = SEED_DOCUMENTS[ContentSection.PROFILE]
    assert isinstance(profile, Profile)
    return profile


async def test_seed_missing_seeds_a_fresh_database_once(db_ctx: DatabaseContext) -> None:
    # Arrange
    service = ContentService(ContentRepository(db_ctx), make_revalidation())

    # Act
    first = await service.seed_missing(SEED_DOCUMENTS)
    second = await service.seed_missing(SEED_DOCUMENTS)

    # Assert
    assert first == list(ContentSection)
    assert second == []


async def test_published_returns_the_seed_on_a_fresh_database(db_ctx: DatabaseContext) -> None:
    service = await make_service(db_ctx, make_revalidation())

    published = await service.published()

    assert published.content.profile == seed_profile()
    assert published.content.links == SEED_DOCUMENTS[ContentSection.LINKS]


async def test_published_fails_clearly_when_a_section_is_missing(db_ctx: DatabaseContext) -> None:
    service = ContentService(ContentRepository(db_ctx), make_revalidation())
    await service.seed_missing({ContentSection.PROFILE: seed_profile()})

    with pytest.raises(SectionMissingError):
        await service.published()


async def test_save_stores_the_document_and_revalidates_its_pages(db_ctx: DatabaseContext) -> None:
    # Arrange
    revalidation = make_revalidation()
    service = await make_service(db_ctx, revalidation)
    before = await service.published()
    edited = seed_profile().model_copy(update={"badge": "EDITED"})

    # Act
    saved = await service.save(PROFILE, edited, if_match=None)

    # Assert
    assert saved.document == edited
    assert saved.revalidation == RevalidationStatus.DONE
    revalidation.revalidate.assert_awaited_once_with(PROFILE.paths)
    after = await service.published()
    assert after.content.profile.badge == "EDITED"
    assert after.etag != before.etag
    assert (await service.get(PROFILE)).etag == saved.etag


async def test_save_reports_a_failed_revalidation_but_keeps_the_write(db_ctx: DatabaseContext) -> None:
    service = await make_service(db_ctx, make_revalidation(RevalidationStatus.FAILED))
    edited = seed_profile().model_copy(update={"badge": "KEPT"})

    saved = await service.save(PROFILE, edited, if_match=None)

    assert saved.revalidation == RevalidationStatus.FAILED
    assert (await service.get(PROFILE)).document.badge == "KEPT"


async def test_save_with_the_loaded_etag_succeeds(db_ctx: DatabaseContext) -> None:
    service = await make_service(db_ctx, make_revalidation())
    loaded = await service.get(LINKS)

    saved = await service.save(LINKS, loaded.document, if_match=loaded.etag)

    assert saved.etag == loaded.etag


async def test_save_with_a_stale_etag_is_refused(db_ctx: DatabaseContext) -> None:
    # Arrange
    revalidation = make_revalidation()
    service = await make_service(db_ctx, revalidation)
    loaded = await service.get(PROFILE)
    await service.save(PROFILE, seed_profile().model_copy(update={"badge": "FIRST"}), if_match=None)
    revalidation.revalidate.reset_mock()

    # Act / Assert
    with pytest.raises(PreconditionFailedError):
        await service.save(PROFILE, seed_profile().model_copy(update={"badge": "SECOND"}), if_match=loaded.etag)
    assert (await service.get(PROFILE)).document.badge == "FIRST"
    revalidation.revalidate.assert_not_awaited()
