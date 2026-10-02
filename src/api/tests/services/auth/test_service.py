from collections.abc import Callable
from datetime import UTC, datetime, timedelta

import pytest
from argon2 import PasswordHasher

from config import Config
from db.database import DatabaseContext
from repo.admin_session import AdminSessionRepository
from services.auth.service import SESSION_TTL, AuthService
from services.auth.throttle import LoginThrottle
from services.auth.types import (
    AdminLoginDisabledError,
    CsrfTokenError,
    InvalidPasswordError,
    LoginThrottledError,
    NotAuthenticatedError,
)

CLIENT = "100.64.0.1"


@pytest.fixture
def make_service(
    db_ctx: DatabaseContext, password_hasher: PasswordHasher, config: Config
) -> Callable[..., AuthService]:
    def make(service_config: Config = config) -> AuthService:
        return AuthService(AdminSessionRepository(db_ctx), LoginThrottle(), password_hasher, service_config)

    return make


async def test_login_with_the_password_creates_a_session(
    make_service: Callable[..., AuthService], admin_password: str
) -> None:
    # Arrange
    service = make_service()

    # Act
    session = await service.login(admin_password, CLIENT)

    # Assert
    assert session.expires_at - datetime.now(UTC) == pytest.approx(SESSION_TTL, abs=timedelta(seconds=5))
    stored = await service.authenticate(session.token)
    assert stored.csrf_token == session.csrf_token
    # Only a hash of the cookie token is stored.
    assert stored.token_hash != session.token


async def test_login_with_a_wrong_password_fails(make_service: Callable[..., AuthService]) -> None:
    with pytest.raises(InvalidPasswordError):
        await make_service().login("wrong", CLIENT)


async def test_login_is_throttled_after_five_failures_even_with_the_password(
    make_service: Callable[..., AuthService], admin_password: str
) -> None:
    # Arrange
    service = make_service()
    for _ in range(5):
        with pytest.raises(InvalidPasswordError):
            await service.login("wrong", CLIENT)

    # Act / Assert
    with pytest.raises(LoginThrottledError) as raised:
        await service.login(admin_password, CLIENT)
    assert raised.value.retry_after_seconds > 0


async def test_login_is_disabled_without_a_password_hash(
    make_service: Callable[..., AuthService], make_config: Callable[..., Config], admin_password: str
) -> None:
    service = make_service(make_config(password_hash_value=None))

    with pytest.raises(AdminLoginDisabledError):
        await service.login(admin_password, CLIENT)


async def test_authenticate_rejects_a_missing_or_unknown_token(make_service: Callable[..., AuthService]) -> None:
    service = make_service()

    with pytest.raises(NotAuthenticatedError):
        await service.authenticate(None)
    with pytest.raises(NotAuthenticatedError):
        await service.authenticate("not-a-session")


async def test_logout_ends_the_session(make_service: Callable[..., AuthService], admin_password: str) -> None:
    # Arrange
    service = make_service()
    new_session = await service.login(admin_password, CLIENT)
    session = await service.authenticate(new_session.token)

    # Act
    await service.logout(session)

    # Assert
    with pytest.raises(NotAuthenticatedError):
        await service.authenticate(new_session.token)


async def test_check_csrf_needs_the_session_token(
    make_service: Callable[..., AuthService], admin_password: str
) -> None:
    service = make_service()
    session = await service.authenticate((await service.login(admin_password, CLIENT)).token)

    AuthService.check_csrf(session, session.csrf_token)
    with pytest.raises(CsrfTokenError):
        AuthService.check_csrf(session, None)
    with pytest.raises(CsrfTokenError):
        AuthService.check_csrf(session, "forged")
