from http import HTTPStatus

from fastapi.testclient import TestClient

from main import app


def test_health_returns_ok() -> None:
    # Arrange
    client = TestClient(app)

    # Act
    response = client.get("/health")

    # Assert
    assert response.status_code == HTTPStatus.OK
    assert response.json() == {"status": "ok"}
