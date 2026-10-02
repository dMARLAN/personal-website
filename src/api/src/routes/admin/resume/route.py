from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, UploadFile, status

from auth.admin import require_admin_write
from container import Container
from services.resume.service import ResumeService
from services.resume.types import MAX_RESUME_BYTES, SavedResume

router = APIRouter(dependencies=[Depends(require_admin_write)])


@router.put(
    "",
    operation_id="adminUploadResume",
    responses={
        status.HTTP_413_CONTENT_TOO_LARGE: {"description": f"Larger than {MAX_RESUME_BYTES} bytes."},
        status.HTTP_415_UNSUPPORTED_MEDIA_TYPE: {"description": "Not a PDF."},
    },
)
@inject
async def upload_resume(
    file: UploadFile,
    resume_service: Annotated[ResumeService, Depends(Provide[Container.resume_service])],
) -> SavedResume:
    # One byte past the limit is enough to know the file is too large.
    content = await file.read(MAX_RESUME_BYTES + 1)
    return await resume_service.upload(file.content_type, content)
