import json
from http import HTTPStatus

import pytest
from fastapi.testclient import TestClient

from content.sections import (
    BIT,
    CHECKLIST,
    CONTACT,
    FCS,
    FUEL,
    LINKS,
    MUMI,
    PROFILE,
    PROJECTS,
    RADAR,
    RESUME,
    SERVER,
    WORK,
    ContentSection,
    SectionSpec,
)
from content.base import ContentModel
from seed.content import SEED_DOCUMENTS
from tests.support import AdminClient, RevalidationEndpoint

ALL_SPECS = [
    PROFILE,
    RESUME,
    WORK,
    PROJECTS,
    CONTACT,
    LINKS,
    SERVER,
    FUEL,
    FCS,
    CHECKLIST,
    BIT,
    RADAR,
    MUMI,
]


def section_url(section: ContentSection) -> str:
    return f"/api/admin/content/{section}"


def test_every_section_has_an_admin_route() -> None:
    assert [spec.section for spec in ALL_SPECS] == list(ContentSection)


@pytest.mark.parametrize("spec", ALL_SPECS, ids=lambda spec: spec.section)
def test_get_section_without_a_session_is_401(client: TestClient, spec: SectionSpec[ContentModel]) -> None:
    assert client.get(section_url(spec.section)).status_code == HTTPStatus.UNAUTHORIZED


def test_put_section_without_a_session_is_401(client: TestClient) -> None:
    document = SEED_DOCUMENTS[ContentSection.PROFILE].model_dump(mode="json")

    response = client.put(section_url(ContentSection.PROFILE), json=document)

    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.parametrize("csrf_token", [None, "forged"])
def test_put_section_without_the_csrf_token_is_403(admin: AdminClient, csrf_token: str | None) -> None:
    # Arrange
    document = SEED_DOCUMENTS[ContentSection.PROFILE].model_dump(mode="json")
    document["badge"] = "CSRF"
    headers = {} if csrf_token is None else {"X-CSRF-Token": csrf_token}

    # Act
    response = admin.client.put(section_url(ContentSection.PROFILE), json=document, headers=headers)

    # Assert
    assert response.status_code == HTTPStatus.FORBIDDEN
    assert admin.client.get(section_url(ContentSection.PROFILE)).json()["document"]["badge"] == "PLACEHOLDER"


@pytest.mark.parametrize("spec", ALL_SPECS, ids=lambda spec: spec.section)
def test_every_section_round_trips_through_get_and_put(
    admin: AdminClient, revalidation_endpoint: RevalidationEndpoint, spec: SectionSpec[ContentModel]
) -> None:
    # Arrange
    loaded = admin.client.get(section_url(spec.section))
    assert loaded.status_code == HTTPStatus.OK
    state = loaded.json()

    # Act
    response = admin.client.put(
        section_url(spec.section),
        json=state["document"],
        headers={**admin.csrf_headers, "If-Match": f'"{state["etag"]}"'},
    )

    # Assert
    assert response.status_code == HTTPStatus.OK
    assert response.json()["document"] == state["document"]
    assert response.json()["revalidation"] == "done"
    [request] = revalidation_endpoint.requests
    assert json.loads(request.content) == {"paths": list(spec.paths)}


def test_put_section_publishes_the_change_and_revalidates_its_page(
    admin: AdminClient, revalidation_endpoint: RevalidationEndpoint
) -> None:
    # Arrange
    state = admin.client.get(section_url(ContentSection.PROFILE)).json()
    document = {**state["document"], "badge": "EDITED"}
    before = admin.client.get("/api/content").headers["ETag"]

    # Act
    response = admin.client.put(section_url(ContentSection.PROFILE), json=document, headers=admin.csrf_headers)

    # Assert
    assert response.status_code == HTTPStatus.OK
    saved = response.json()
    assert saved["etag"] != state["etag"]
    assert set(saved) == {"document", "etag", "updatedAt", "revalidation"}
    published = admin.client.get("/api/content")
    assert published.json()["profile"]["badge"] == "EDITED"
    assert published.headers["ETag"] != before
    [request] = revalidation_endpoint.requests
    assert request.headers["Authorization"] == "Bearer test-revalidate-secret"
    assert json.loads(request.content) == {"paths": ["/about"]}


def test_put_section_still_saves_when_revalidation_fails(
    admin: AdminClient, revalidation_endpoint: RevalidationEndpoint
) -> None:
    revalidation_endpoint.status_code = 500
    document = {**admin.client.get(section_url(ContentSection.PROFILE)).json()["document"], "badge": "SAVED"}

    response = admin.client.put(section_url(ContentSection.PROFILE), json=document, headers=admin.csrf_headers)

    assert response.status_code == HTTPStatus.OK
    assert response.json()["revalidation"] == "failed"
    assert admin.client.get("/api/content").json()["profile"]["badge"] == "SAVED"


def test_put_section_with_a_stale_if_match_is_412(admin: AdminClient) -> None:
    # Arrange
    stale = admin.client.get(section_url(ContentSection.PROFILE)).json()
    first = {**stale["document"], "badge": "FIRST"}
    admin.client.put(section_url(ContentSection.PROFILE), json=first, headers=admin.csrf_headers)

    # Act
    response = admin.client.put(
        section_url(ContentSection.PROFILE),
        json={**stale["document"], "badge": "SECOND"},
        headers={**admin.csrf_headers, "If-Match": f'"{stale["etag"]}"'},
    )

    # Assert
    assert response.status_code == HTTPStatus.PRECONDITION_FAILED
    assert admin.client.get("/api/content").json()["profile"]["badge"] == "FIRST"


@pytest.mark.parametrize(
    ("field", "value", "error_type"),
    [
        ("badge", "X" * 19, "string_too_long"),
        ("badge", "BANG!", "value_error"),
        ("bio", " ".join(["placeholder"] * 30), "value_error"),
    ],
)
def test_put_section_that_cannot_render_is_422_and_changes_nothing(
    admin: AdminClient, revalidation_endpoint: RevalidationEndpoint, field: str, value: str, error_type: str
) -> None:
    # Arrange
    document = {**admin.client.get(section_url(ContentSection.PROFILE)).json()["document"], field: value}

    # Act
    response = admin.client.put(section_url(ContentSection.PROFILE), json=document, headers=admin.csrf_headers)

    # Assert
    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
    [error] = response.json()["detail"]
    assert error["loc"] == ["body", field]
    assert error["type"] == error_type
    assert admin.client.get("/api/content").json()["profile"][field] != value
    assert revalidation_endpoint.requests == []
