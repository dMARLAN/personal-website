from collections.abc import Callable
from http import HTTPStatus

from fastapi.testclient import TestClient

from config import Config
from container import Container
from main import create_app


def cookie_attributes(set_cookie: str) -> dict[str, str]:
    """A `Set-Cookie` header as `{"name": ..., "value": ..., attribute (lower case): value or ""}`."""
    first, *attributes = [part.strip() for part in set_cookie.split(";")]
    name, value = first.split("=", 1)
    parsed = {"name": name, "value": value}
    for attribute in attributes:
        key, _, attribute_value = attribute.partition("=")
        parsed[key.lower()] = attribute_value
    return parsed


def test_login_sets_a_locked_down_session_cookie(client: TestClient, admin_password: str) -> None:
    # Act
    response = client.post("/api/admin/login", json={"password": admin_password})

    # Assert
    assert response.status_code == HTTPStatus.OK
    assert set(response.json()) == {"csrfToken", "expiresAt"}
    attributes = cookie_attributes(response.headers["set-cookie"])
    assert attributes["name"] == "pw_admin_session"
    assert {"httponly", "secure"} <= attributes.keys()
    assert attributes["samesite"] == "strict"
    assert attributes["path"] == "/"
    assert attributes["max-age"] == str(12 * 60 * 60)


def test_a_forwarded_session_cookie_reads_the_session_and_drafts(
    container: Container, client: TestClient, admin_password: str
) -> None:
    # Arrange: the browser sends the site-wide cookie with a page request, and the Next server forwards it as a
    # plain Cookie header from a client of its own.
    login = client.post("/api/admin/login", json={"password": admin_password})
    token = cookie_attributes(login.headers["set-cookie"])["value"]
    with TestClient(create_app(container), base_url="https://testserver") as next_server:
        headers = {"Cookie": f"pw_admin_session={token}"}

        # Act
        session = next_server.get("/api/admin/session", headers=headers)
        drafts = next_server.get("/api/admin/drafts", headers=headers)

    # Assert
    assert session.status_code == HTTPStatus.OK
    assert session.json()["csrfToken"] == login.json()["csrfToken"]
    assert drafts.status_code == HTTPStatus.OK


def test_a_forwarded_session_cookie_alone_cannot_write(
    container: Container, client: TestClient, admin_password: str
) -> None:
    # Arrange
    login = client.post("/api/admin/login", json={"password": admin_password})
    token = cookie_attributes(login.headers["set-cookie"])["value"]

    # Act
    with TestClient(create_app(container), base_url="https://testserver") as next_server:
        response = next_server.delete("/api/admin/drafts/profile", headers={"Cookie": f"pw_admin_session={token}"})

    # Assert
    assert response.status_code == HTTPStatus.FORBIDDEN


def test_login_with_a_wrong_password_is_401_without_a_cookie(client: TestClient) -> None:
    response = client.post("/api/admin/login", json={"password": "wrong"})

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.json() == {"detail": "INVALID_PASSWORD"}
    assert "set-cookie" not in response.headers


def test_login_is_rate_limited_after_five_failures(client: TestClient, admin_password: str) -> None:
    # Arrange
    for _ in range(5):
        assert client.post("/api/admin/login", json={"password": "wrong"}).status_code == HTTPStatus.UNAUTHORIZED

    # Act
    response = client.post("/api/admin/login", json={"password": admin_password})

    # Assert
    assert response.status_code == HTTPStatus.TOO_MANY_REQUESTS
    assert int(response.headers["Retry-After"]) > 0
    assert "set-cookie" not in response.headers


def test_login_without_a_configured_hash_is_503(make_config: Callable[..., Config], admin_password: str) -> None:
    # Arrange
    container = Container()
    container.config.override(make_config(password_hash_value=None))

    # Act
    with TestClient(create_app(container), base_url="https://testserver") as client:
        response = client.post("/api/admin/login", json={"password": admin_password})

    # Assert
    assert response.status_code == HTTPStatus.SERVICE_UNAVAILABLE
    assert response.json() == {"detail": "LOGIN_DISABLED"}


def test_login_refuses_a_form_post(client: TestClient, admin_password: str) -> None:
    # A cross-site form can only send form encodings; the JSON-only body keeps it from logging a browser in.
    response = client.post("/api/admin/login", data={"password": admin_password})

    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY


def test_session_without_a_cookie_is_401(client: TestClient) -> None:
    response = client.get("/api/admin/session")

    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.json() == {"detail": "NOT_AUTHENTICATED"}


def test_session_returns_the_csrf_token_after_login(client: TestClient, admin_password: str) -> None:
    login = client.post("/api/admin/login", json={"password": admin_password})

    response = client.get("/api/admin/session")

    assert response.status_code == HTTPStatus.OK
    assert response.json()["csrfToken"] == login.json()["csrfToken"]


def test_session_with_a_forged_cookie_is_401(client: TestClient) -> None:
    client.cookies.set("pw_admin_session", "forged", domain="testserver", path="/")

    assert client.get("/api/admin/session").status_code == HTTPStatus.UNAUTHORIZED


def test_logout_without_the_csrf_token_is_403(client: TestClient, admin_password: str) -> None:
    client.post("/api/admin/login", json={"password": admin_password})

    response = client.post("/api/admin/logout")

    assert response.status_code == HTTPStatus.FORBIDDEN
    assert response.json() == {"detail": "CSRF_TOKEN_INVALID"}
    assert client.get("/api/admin/session").status_code == HTTPStatus.OK


def test_logout_ends_the_session_and_clears_the_cookie(client: TestClient, admin_password: str) -> None:
    # Arrange
    csrf_token = client.post("/api/admin/login", json={"password": admin_password}).json()["csrfToken"]
    token = client.cookies.get("pw_admin_session")

    # Act
    response = client.post("/api/admin/logout", headers={"X-CSRF-Token": csrf_token})

    # Assert
    assert response.status_code == HTTPStatus.NO_CONTENT
    assert cookie_attributes(response.headers["set-cookie"])["max-age"] == "0"
    client.cookies.set("pw_admin_session", str(token), domain="testserver", path="/")
    assert client.get("/api/admin/session").status_code == HTTPStatus.UNAUTHORIZED
