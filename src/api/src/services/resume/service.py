import hashlib
import os
import shutil
import tempfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Final

from config import Config
from content.sections import RESUME_PDF_PATHS
from proj_logging.logger import get_logger
from services.resume.types import (
    MAX_RESUME_BYTES,
    PDF_CONTENT_TYPE,
    NotAPdfError,
    ResumeFile,
    ResumeNotFoundError,
    ResumeTooLargeError,
    SavedResume,
)
from services.revalidation.service import RevalidationService

log = get_logger(__name__)

_PDF_MAGIC: Final[bytes] = b"%PDF-"


def _etag(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


class ResumeService:
    """The resume PDF, kept as one file on the data volume next to the database."""

    def __init__(self, config: Config, revalidation_service: RevalidationService) -> None:
        self.__path = config.storage.resume_path
        self.__revalidation_service = revalidation_service

    def read(self) -> ResumeFile:
        try:
            content = self.__path.read_bytes()
            modified = self.__path.stat().st_mtime
        except FileNotFoundError as error:
            raise ResumeNotFoundError from error
        return ResumeFile(content=content, etag=_etag(content), modified_at=datetime.fromtimestamp(modified, UTC))

    async def upload(self, content_type: str | None, content: bytes) -> SavedResume:
        """Validate and store an upload. `content` may be one byte over the limit: the caller reads no further."""
        if len(content) > MAX_RESUME_BYTES:
            raise ResumeTooLargeError
        if content_type != PDF_CONTENT_TYPE or not content.startswith(_PDF_MAGIC):
            raise NotAPdfError
        self.__write_atomically(content)
        log.info(f"Stored a new resume PDF ({len(content)} bytes)")
        revalidation = await self.__revalidation_service.revalidate(RESUME_PDF_PATHS)
        return SavedResume(etag=_etag(content), size=len(content), revalidation=revalidation)

    def seed_missing(self, seed_pdf: Path) -> bool:
        """Copy the placeholder PDF onto a fresh volume. Returns whether it copied."""
        if self.__path.exists():
            return False
        self.__path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(seed_pdf, self.__path)
        log.info("Seeded the placeholder resume PDF")
        return True

    def __write_atomically(self, content: bytes) -> None:
        # Write beside the target and rename over it, so a reader never sees a half-written PDF.
        with tempfile.NamedTemporaryFile(dir=self.__path.parent, prefix=".resume-", delete=False) as file:
            file.write(content)
            file.flush()
            os.fsync(file.fileno())
        Path(file.name).replace(self.__path)
