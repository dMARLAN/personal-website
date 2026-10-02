import json
from collections.abc import Callable

import httpx2

from config import Config
from services.revalidation.service import RevalidationService
from services.revalidation.types import RevalidationStatus

type Handler = Callable[[httpx2.Request], httpx2.Response]


def make_service(config: Config, handler: Handler) -> RevalidationService:
    return RevalidationService(httpx2.AsyncClient(transport=httpx2.MockTransport(handler)), config)


async def test_revalidate_posts_the_paths_with_the_shared_secret(config: Config) -> None:
    # Arrange
    requests: list[httpx2.Request] = []

    def accept(request: httpx2.Request) -> httpx2.Response:
        requests.append(request)
        return httpx2.Response(200, json={"revalidated": True})

    service = make_service(config, accept)

    # Act
    status = await service.revalidate(("/about", "/"))

    # Assert
    assert status == RevalidationStatus.DONE
    [request] = requests
    assert request.method == "POST"
    assert str(request.url) == config.revalidate.url
    assert request.headers["Authorization"] == f"Bearer {config.revalidate.secret.get_secret_value()}"
    assert request.headers["Content-Type"] == "application/json"
    assert json.loads(request.content) == {"paths": ["/about", "/"]}


async def test_revalidate_reports_an_error_status_as_failed(config: Config) -> None:
    service = make_service(config, lambda _: httpx2.Response(401))

    assert await service.revalidate(("/about",)) == RevalidationStatus.FAILED


async def test_revalidate_reports_an_unreachable_frontend_as_failed(config: Config) -> None:
    def refuse(request: httpx2.Request) -> httpx2.Response:
        raise httpx2.ConnectError("connection refused", request=request)

    service = make_service(config, refuse)

    assert await service.revalidate(("/about",)) == RevalidationStatus.FAILED
