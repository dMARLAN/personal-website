from http import HTTPStatus

from fastapi.testclient import TestClient

from content.sections import ContentSection
from seed.content import SEED_DOCUMENTS


def test_get_site_content_returns_every_section_from_the_seed(client: TestClient) -> None:
    # Act
    response = client.get("/api/content")

    # Assert
    assert response.status_code == HTTPStatus.OK
    body = response.json()
    assert list(body) == [section.value for section in ContentSection]
    assert body["profile"] == SEED_DOCUMENTS[ContentSection.PROFILE].model_dump(mode="json")
    assert body["links"]["links"][2] == {"name": "Resume", "tag": "PDF", "url": "/api/resume.pdf"}


def test_get_site_content_sends_an_etag_and_no_cache(client: TestClient) -> None:
    response = client.get("/api/content")

    assert response.headers["Cache-Control"] == "public, no-cache"
    assert response.headers["ETag"].startswith('"')


def test_get_site_content_answers_304_for_the_current_etag(client: TestClient) -> None:
    # Arrange
    etag = client.get("/api/content").headers["ETag"]

    # Act
    response = client.get("/api/content", headers={"If-None-Match": etag})

    # Assert
    assert response.status_code == HTTPStatus.NOT_MODIFIED
    assert response.content == b""
    assert response.headers["ETag"] == etag


def test_get_site_content_answers_200_for_a_stale_etag(client: TestClient) -> None:
    response = client.get("/api/content", headers={"If-None-Match": '"stale"'})

    assert response.status_code == HTTPStatus.OK
