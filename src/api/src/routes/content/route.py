from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, Header, Response, status

from container import Container
from content.sections import SiteContent
from routes.http_cache import PUBLIC_CACHE_CONTROL, matches_if_none_match, quote_etag
from services.content.service import ContentService

router = APIRouter()


@router.get(
    "",
    operation_id="getSiteContent",
    response_model=SiteContent,
    responses={status.HTTP_304_NOT_MODIFIED: {"description": "The content still has the `If-None-Match` ETag."}},
)
@inject
async def get_site_content(
    response: Response,
    content_service: Annotated[ContentService, Depends(Provide[Container.content_service])],
    if_none_match: Annotated[str | None, Header()] = None,
) -> SiteContent | Response:
    published = await content_service.published()
    headers = {"ETag": quote_etag(published.etag), "Cache-Control": PUBLIC_CACHE_CONTROL}
    if matches_if_none_match(if_none_match, published.etag):
        return Response(status_code=status.HTTP_304_NOT_MODIFIED, headers=headers)
    response.headers.update(headers)
    return published.content
