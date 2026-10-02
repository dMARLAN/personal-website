from email.utils import format_datetime
from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, Header, Response, status

from container import Container
from routes.http_cache import PUBLIC_CACHE_CONTROL, matches_if_none_match, quote_etag
from services.resume.service import ResumeService
from services.resume.types import PDF_CONTENT_TYPE

router = APIRouter()


@router.get(
    "/resume.pdf",
    operation_id="downloadResume",
    response_class=Response,
    responses={
        status.HTTP_200_OK: {"content": {PDF_CONTENT_TYPE: {}}, "description": "The resume PDF."},
        status.HTTP_304_NOT_MODIFIED: {"description": "The PDF still has the `If-None-Match` ETag."},
        status.HTTP_404_NOT_FOUND: {"description": "No resume has been uploaded."},
    },
)
@inject
def download_resume(
    resume_service: Annotated[ResumeService, Depends(Provide[Container.resume_service])],
    if_none_match: Annotated[str | None, Header()] = None,
) -> Response:
    resume = resume_service.read()
    headers = {
        "ETag": quote_etag(resume.etag),
        "Cache-Control": PUBLIC_CACHE_CONTROL,
        "Last-Modified": format_datetime(resume.modified_at, usegmt=True),
    }
    if matches_if_none_match(if_none_match, resume.etag):
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=headers)
    return Response(
        content=resume.content,
        media_type=PDF_CONTENT_TYPE,
        headers={
            **headers,
            "Content-Disposition": 'inline; filename="resume.pdf"',
            "X-Content-Type-Options": "nosniff",
        },
    )
