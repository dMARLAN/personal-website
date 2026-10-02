import json
from http import HTTPStatus
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from services.resume.types import MAX_RESUME_BYTES
from tests.support import AdminClient, RevalidationEndpoint

PDF = b"%PDF-1.7\n% uploaded in a test\n%%EOF\n"
SEED_PDF = Path(__file__).parents[2] / "src" / "seed" / "resume.pdf"


def upload(admin: AdminClient, content: bytes, content_type: str, *, csrf: bool = True) -> int:
    response = admin.client.put(
        "/api/admin/resume",
        files={"file": ("resume.pdf", content, content_type)},
        headers=admin.csrf_headers if csrf else {},
    )
    return response.status_code


def test_download_serves_the_seeded_pdf(client: TestClient) -> None:
    # Act
    response = client.get("/api/resume.pdf")

    # Assert
    assert response.status_code == HTTPStatus.OK
    assert response.content == SEED_PDF.read_bytes()
    assert response.headers["Content-Type"] == "application/pdf"
    assert response.headers["Content-Disposition"] == 'inline; filename="resume.pdf"'
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["Cache-Control"] == "public, no-cache"
    assert response.headers["ETag"].startswith('"')
    assert response.headers["Last-Modified"].endswith("GMT")


def test_download_answers_304_for_the_current_etag(client: TestClient) -> None:
    etag = client.get("/api/resume.pdf").headers["ETag"]

    response = client.get("/api/resume.pdf", headers={"If-None-Match": etag})

    assert response.status_code == HTTPStatus.NOT_MODIFIED
    assert response.content == b""


def test_upload_without_a_session_is_401(client: TestClient) -> None:
    response = client.put("/api/admin/resume", files={"file": ("resume.pdf", PDF, "application/pdf")})

    assert response.status_code == HTTPStatus.UNAUTHORIZED


def test_upload_without_the_csrf_token_is_403(admin: AdminClient) -> None:
    assert upload(admin, PDF, "application/pdf", csrf=False) == HTTPStatus.FORBIDDEN


def test_upload_replaces_the_download_and_revalidates(
    admin: AdminClient, revalidation_endpoint: RevalidationEndpoint
) -> None:
    # Arrange
    old_etag = admin.client.get("/api/resume.pdf").headers["ETag"]

    # Act
    status = upload(admin, PDF, "application/pdf")

    # Assert
    assert status == HTTPStatus.OK
    download = admin.client.get("/api/resume.pdf")
    assert download.content == PDF
    assert download.headers["ETag"] != old_etag
    [request] = revalidation_endpoint.requests
    assert json.loads(request.content) == {"paths": ["/resume"]}


@pytest.mark.parametrize(
    ("content", "content_type"),
    [(PDF, "text/plain"), (b"<html>not a pdf</html>", "application/pdf"), (b"", "application/pdf")],
)
def test_upload_of_a_non_pdf_is_415(admin: AdminClient, content: bytes, content_type: str) -> None:
    assert upload(admin, content, content_type) == HTTPStatus.UNSUPPORTED_MEDIA_TYPE
    assert admin.client.get("/api/resume.pdf").content == SEED_PDF.read_bytes()


def test_upload_over_the_size_limit_is_413(admin: AdminClient) -> None:
    assert upload(admin, PDF + b"0" * MAX_RESUME_BYTES, "application/pdf") == HTTPStatus.REQUEST_ENTITY_TOO_LARGE
