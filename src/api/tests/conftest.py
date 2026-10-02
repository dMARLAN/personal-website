import os
import tempfile
from collections.abc import AsyncGenerator, Callable, Generator
from http import HTTPStatus
from pathlib import Path
from typing import Final

# `main` builds its module-level app at import, which reads these. Each test still gets its own data dir below.
os.environ.setdefault("STORAGE_DATA_DIR", tempfile.mkdtemp(prefix="pw-api-tests-"))
os.environ.setdefault("REVALIDATE_URL", "http://frontend.test/revalidate")
os.environ.setdefault("REVALIDATE_SECRET", "test-revalidate-secret")

import httpx2  # noqa: E402
import pytest  # noqa: E402
from argon2 import PasswordHasher  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from pydantic import SecretStr  # noqa: E402

from config import Config  # noqa: E402
from config._admin_auth import AdminAuthConfig  # noqa: E402
from config._app import AppConfig  # noqa: E402
from config._revalidate import RevalidateConfig  # noqa: E402
from config._storage import StorageConfig  # noqa: E402
from container import Container  # noqa: E402
from db.database import DatabaseContext  # noqa: E402
from db.migrate import upgrade  # noqa: E402
from main import create_app  # noqa: E402
from tests.support import AdminClient, RevalidationEndpoint  # noqa: E402

_ADMIN_PASSWORD: Final[str] = "correct horse battery staple"
_REVALIDATE_URL: Final[str] = "http://frontend.test/revalidate"
_REVALIDATE_SECRET: Final[str] = "test-revalidate-secret"
# Cheap argon2 parameters keep the suite fast; production hashes come from `cli.py hash-password`.
_TEST_HASHER: Final[PasswordHasher] = PasswordHasher(time_cost=1, memory_cost=8, parallelism=1)


@pytest.fixture(scope="session")
def admin_password() -> str:
    return _ADMIN_PASSWORD


@pytest.fixture(scope="session")
def password_hasher() -> PasswordHasher:
    return _TEST_HASHER


@pytest.fixture(scope="session")
def password_hash() -> str:
    return _TEST_HASHER.hash(_ADMIN_PASSWORD)


@pytest.fixture
def make_config(tmp_path: Path, password_hash: str) -> Callable[..., Config]:
    def make(*, password_hash_value: str | None = password_hash) -> Config:
        return Config(
            app=AppConfig(),
            storage=StorageConfig(data_dir=tmp_path),
            admin_auth=AdminAuthConfig(
                password_hash=None if password_hash_value is None else SecretStr(password_hash_value)
            ),
            revalidate=RevalidateConfig(url=_REVALIDATE_URL, secret=SecretStr(_REVALIDATE_SECRET)),
        )

    return make


@pytest.fixture
def config(make_config: Callable[..., Config]) -> Config:
    return make_config()


@pytest.fixture
def revalidation_endpoint() -> RevalidationEndpoint:
    return RevalidationEndpoint()


@pytest.fixture
def container(config: Config, revalidation_endpoint: RevalidationEndpoint) -> Container:
    container = Container()
    container.config.override(config)
    container.password_hasher.override(_TEST_HASHER)
    container.http_client.override(httpx2.AsyncClient(transport=httpx2.MockTransport(revalidation_endpoint.handle)))
    return container


@pytest.fixture
def client(container: Container) -> Generator[TestClient]:
    # https, so the client sends back the Secure session cookie.
    with TestClient(create_app(container), base_url="https://testserver") as test_client:
        yield test_client


@pytest.fixture
def admin(client: TestClient, admin_password: str) -> AdminClient:
    response = client.post("/api/admin/login", json={"password": admin_password})
    assert response.status_code == HTTPStatus.OK
    return AdminClient(client=client, csrf_token=response.json()["csrfToken"])


@pytest.fixture
async def db_ctx(tmp_path: Path) -> AsyncGenerator[DatabaseContext]:
    db_path = tmp_path / "site.db"
    upgrade(db_path)
    db_ctx = DatabaseContext(db_path)
    yield db_ctx
    await db_ctx.dispose()
