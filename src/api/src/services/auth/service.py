import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from typing import Final

from anyio import to_thread
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from config import Config
from proj_logging.logger import get_logger
from repo.admin_session import AdminSessionRepository
from repo.types import AdminSessionRecord
from services.auth.throttle import LoginThrottle
from services.auth.types import (
    AdminLoginDisabledError,
    CsrfTokenError,
    InvalidPasswordError,
    LoginThrottledError,
    NewAdminSession,
    NotAuthenticatedError,
)

log = get_logger(__name__)

SESSION_TTL: Final[timedelta] = timedelta(hours=12)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class AuthService:
    """Single-user admin auth: one argon2 password hash from the environment and server-side sessions."""

    def __init__(
        self,
        session_repo: AdminSessionRepository,
        throttle: LoginThrottle,
        hasher: PasswordHasher,
        config: Config,
    ) -> None:
        self.__session_repo = session_repo
        self.__throttle = throttle
        self.__hasher = hasher
        self.__password_hash = config.admin_auth.password_hash

    async def login(self, password: str, client: str) -> NewAdminSession:
        if self.__password_hash is None:
            raise AdminLoginDisabledError
        if (retry_after := self.__throttle.retry_after(client)) is not None:
            raise LoginThrottledError(retry_after)
        # argon2 is deliberately slow; keep it off the event loop.
        if not await to_thread.run_sync(self.__verify, self.__password_hash.get_secret_value(), password):
            self.__throttle.record_failure(client)
            log.warning(f"Failed admin login from {client}")
            raise InvalidPasswordError
        self.__throttle.reset(client)

        now = datetime.now(UTC)
        await self.__session_repo.delete_expired(now)
        token = secrets.token_urlsafe(32)
        record = AdminSessionRecord(
            token_hash=_hash_token(token),
            csrf_token=secrets.token_urlsafe(32),
            created_at=now,
            expires_at=now + SESSION_TTL,
        )
        await self.__session_repo.create(record)
        log.info(f"Admin signed in from {client}")
        return NewAdminSession(token=token, csrf_token=record.csrf_token, expires_at=record.expires_at)

    async def authenticate(self, token: str | None) -> AdminSessionRecord:
        if token is None:
            raise NotAuthenticatedError
        if session := await self.__session_repo.get_active(_hash_token(token), datetime.now(UTC)):
            return session
        raise NotAuthenticatedError

    @staticmethod
    def check_csrf(session: AdminSessionRecord, csrf_token: str | None) -> None:
        if csrf_token is None or not hmac.compare_digest(csrf_token, session.csrf_token):
            raise CsrfTokenError

    async def logout(self, session: AdminSessionRecord) -> None:
        await self.__session_repo.delete(session.token_hash)

    def __verify(self, password_hash: str, password: str) -> bool:
        try:
            return self.__hasher.verify(password_hash, password)
        except VerificationError:
            return False
        except InvalidHashError as error:
            raise RuntimeError("ADMIN_AUTH_PASSWORD_HASH is not an argon2 hash") from error
