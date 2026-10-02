import hashlib
from pathlib import Path
from unittest.mock import AsyncMock, create_autospec

import pytest

from config import Config
from services.resume.service import ResumeService
from services.resume.types import MAX_RESUME_BYTES, NotAPdfError, ResumeNotFoundError, ResumeTooLargeError
from services.revalidation.service import RevalidationService
from services.revalidation.types import RevalidationStatus

PDF = b"%PDF-1.7\n% a tiny test PDF\n%%EOF\n"


@pytest.fixture
def revalidation() -> AsyncMock:
    revalidation = create_autospec(RevalidationService, instance=True)
    revalidation.revalidate = AsyncMock(return_value=RevalidationStatus.DONE)
    return revalidation


@pytest.fixture
def service(config: Config, revalidation: AsyncMock) -> ResumeService:
    return ResumeService(config, revalidation)


async def test_upload_stores_the_pdf_and_revalidates_the_resume_page(
    service: ResumeService, revalidation: AsyncMock, config: Config
) -> None:
    # Act
    saved = await service.upload("application/pdf", PDF)

    # Assert
    assert saved.etag == hashlib.sha256(PDF).hexdigest()
    assert saved.size == len(PDF)
    assert config.storage.resume_path.read_bytes() == PDF
    assert service.read().etag == saved.etag
    revalidation.revalidate.assert_awaited_once_with(("/resume",))


@pytest.mark.parametrize("content_type", ["text/plain", "application/octet-stream", None])
async def test_upload_rejects_a_non_pdf_content_type(service: ResumeService, content_type: str | None) -> None:
    with pytest.raises(NotAPdfError):
        await service.upload(content_type, PDF)


async def test_upload_rejects_a_file_without_the_pdf_magic_bytes(service: ResumeService, config: Config) -> None:
    with pytest.raises(NotAPdfError):
        await service.upload("application/pdf", b"<html>not a pdf</html>")
    assert not config.storage.resume_path.exists()


async def test_upload_rejects_a_file_over_the_limit(service: ResumeService) -> None:
    with pytest.raises(ResumeTooLargeError):
        await service.upload("application/pdf", PDF + b"0" * MAX_RESUME_BYTES)


def test_read_without_an_upload_is_not_found(service: ResumeService) -> None:
    with pytest.raises(ResumeNotFoundError):
        service.read()


def test_seed_missing_copies_only_onto_an_empty_volume(service: ResumeService, tmp_path: Path) -> None:
    # Arrange
    seed = tmp_path / "seed.pdf"
    seed.write_bytes(PDF)

    # Act
    first = service.seed_missing(seed)
    seed.write_bytes(b"%PDF-changed")
    second = service.seed_missing(seed)

    # Assert
    assert (first, second) == (True, False)
    assert service.read().content == PDF
