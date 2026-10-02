from http import HTTPStatus
from typing import Any

import pytest
from fastapi.testclient import TestClient

from content.sections import ContentSection
from seed.content import SEED_DOCUMENTS
from tests.support import AdminClient, RevalidationEndpoint


def draft_url(section: ContentSection) -> str:
    return f"/api/admin/drafts/{section}"


def seed(section: ContentSection) -> dict[str, Any]:
    return SEED_DOCUMENTS[section].model_dump(mode="json")


def edited_profile() -> dict[str, Any]:
    return {**seed(ContentSection.PROFILE), "badge": "DRAFT"}


@pytest.mark.parametrize("section", list(ContentSection))
def test_every_section_saves_and_reads_back_a_draft(admin: AdminClient, section: ContentSection) -> None:
    # Act
    saved = admin.client.put(draft_url(section), json=seed(section), headers=admin.csrf_headers)
    loaded = admin.client.get(draft_url(section))

    # Assert
    assert saved.status_code == HTTPStatus.OK
    assert set(saved.json()) == {"content", "updatedAt"}
    assert loaded.status_code == HTTPStatus.OK
    assert loaded.json() == saved.json()
    assert loaded.json()["content"] == seed(section)


def test_get_draft_of_a_section_without_one_is_404(admin: AdminClient) -> None:
    response = admin.client.get(draft_url(ContentSection.PROFILE))

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.json() == {"detail": "DRAFT_NOT_FOUND"}


def test_get_drafts_lists_only_the_sections_that_have_one(admin: AdminClient) -> None:
    # Arrange
    admin.client.put(draft_url(ContentSection.PROFILE), json=edited_profile(), headers=admin.csrf_headers)
    admin.client.put(draft_url(ContentSection.LINKS), json=seed(ContentSection.LINKS), headers=admin.csrf_headers)

    # Act
    response = admin.client.get("/api/admin/drafts")

    # Assert
    assert response.status_code == HTTPStatus.OK
    drafts = response.json()
    assert list(drafts) == ["profile", "links"]
    assert drafts["profile"]["content"]["badge"] == "DRAFT"
    assert set(drafts["links"]) == {"content", "updatedAt"}


def test_get_drafts_is_empty_without_drafts(admin: AdminClient) -> None:
    assert admin.client.get("/api/admin/drafts").json() == {}


def test_put_draft_replaces_the_previous_draft(admin: AdminClient) -> None:
    admin.client.put(draft_url(ContentSection.PROFILE), json=edited_profile(), headers=admin.csrf_headers)

    admin.client.put(
        draft_url(ContentSection.PROFILE),
        json={**edited_profile(), "badge": "SECOND"},
        headers=admin.csrf_headers,
    )

    assert admin.client.get(draft_url(ContentSection.PROFILE)).json()["content"]["badge"] == "SECOND"


def test_put_draft_leaves_the_site_and_revalidation_alone(
    admin: AdminClient, revalidation_endpoint: RevalidationEndpoint
) -> None:
    # Arrange
    before = admin.client.get("/api/content")

    # Act
    admin.client.put(draft_url(ContentSection.PROFILE), json=edited_profile(), headers=admin.csrf_headers)

    # Assert
    after = admin.client.get("/api/content")
    assert after.json()["profile"]["badge"] == "PLACEHOLDER"
    assert after.headers["ETag"] == before.headers["ETag"]
    assert revalidation_endpoint.requests == []


def test_put_draft_that_cannot_render_is_422_with_the_field_path(admin: AdminClient) -> None:
    # Act
    response = admin.client.put(
        draft_url(ContentSection.PROFILE), json={**edited_profile(), "badge": "X" * 19}, headers=admin.csrf_headers
    )

    # Assert
    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
    [error] = response.json()["detail"]
    assert error["loc"] == ["body", "badge"]
    assert admin.client.get(draft_url(ContentSection.PROFILE)).status_code == HTTPStatus.NOT_FOUND


def test_put_draft_locates_a_cross_field_rule_at_its_field(admin: AdminClient) -> None:
    # Arrange
    document = seed(ContentSection.PROJECTS)
    document["projects"][1]["slug"] = document["projects"][0]["slug"]

    # Act
    response = admin.client.put(draft_url(ContentSection.PROJECTS), json=document, headers=admin.csrf_headers)

    # Assert
    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
    [error] = response.json()["detail"]
    assert error["loc"] == ["body", "projects", 1, "slug"]


@pytest.mark.parametrize("csrf_token", [None, "forged"])
def test_draft_writes_without_the_csrf_token_are_403(admin: AdminClient, csrf_token: str | None) -> None:
    # Arrange
    headers = {} if csrf_token is None else {"X-CSRF-Token": csrf_token}
    admin.client.put(draft_url(ContentSection.PROFILE), json=edited_profile(), headers=admin.csrf_headers)

    # Act
    put = admin.client.put(draft_url(ContentSection.PROFILE), json=seed(ContentSection.PROFILE), headers=headers)
    delete = admin.client.delete(draft_url(ContentSection.PROFILE), headers=headers)

    # Assert
    assert put.status_code == HTTPStatus.FORBIDDEN
    assert delete.status_code == HTTPStatus.FORBIDDEN
    assert admin.client.get(draft_url(ContentSection.PROFILE)).json()["content"]["badge"] == "DRAFT"


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("GET", "/api/admin/drafts"),
        ("GET", "/api/admin/drafts/profile"),
        ("PUT", "/api/admin/drafts/profile"),
        ("DELETE", "/api/admin/drafts/profile"),
    ],
)
def test_drafts_without_a_session_are_401(client: TestClient, method: str, path: str) -> None:
    response = client.request(method, path, json=seed(ContentSection.PROFILE) if method == "PUT" else None)

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_delete_draft_discards_it(admin: AdminClient) -> None:
    admin.client.put(draft_url(ContentSection.PROFILE), json=edited_profile(), headers=admin.csrf_headers)

    response = admin.client.delete(draft_url(ContentSection.PROFILE), headers=admin.csrf_headers)

    assert response.status_code == HTTPStatus.NO_CONTENT
    assert admin.client.get(draft_url(ContentSection.PROFILE)).status_code == HTTPStatus.NOT_FOUND


def test_delete_draft_without_one_is_204(admin: AdminClient) -> None:
    response = admin.client.delete(draft_url(ContentSection.WORK), headers=admin.csrf_headers)

    assert response.status_code == HTTPStatus.NO_CONTENT


def test_delete_draft_of_an_unknown_section_is_422(admin: AdminClient) -> None:
    response = admin.client.delete("/api/admin/drafts/nope", headers=admin.csrf_headers)

    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


def test_publishing_a_section_deletes_its_draft_only(admin: AdminClient) -> None:
    # Arrange
    admin.client.put(draft_url(ContentSection.PROFILE), json=edited_profile(), headers=admin.csrf_headers)
    admin.client.put(draft_url(ContentSection.LINKS), json=seed(ContentSection.LINKS), headers=admin.csrf_headers)

    # Act
    published = admin.client.put("/api/admin/content/profile", json=edited_profile(), headers=admin.csrf_headers)

    # Assert
    assert published.status_code == HTTPStatus.OK
    assert list(admin.client.get("/api/admin/drafts").json()) == ["links"]
    assert admin.client.get("/api/content").json()["profile"]["badge"] == "DRAFT"


def test_a_publish_refused_by_if_match_keeps_the_draft(admin: AdminClient) -> None:
    # Arrange
    admin.client.put(draft_url(ContentSection.PROFILE), json=edited_profile(), headers=admin.csrf_headers)

    # Act
    response = admin.client.put(
        "/api/admin/content/profile",
        json=edited_profile(),
        headers={**admin.csrf_headers, "If-Match": '"stale"'},
    )

    # Assert
    assert response.status_code == HTTPStatus.PRECONDITION_FAILED
    assert admin.client.get(draft_url(ContentSection.PROFILE)).status_code == HTTPStatus.OK
