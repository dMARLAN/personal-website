from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True, slots=True)
class NewAdminSession:
    """A session just created at login. `token` goes in the cookie and is never stored."""

    token: str
    csrf_token: str
    expires_at: datetime


class AdminLoginDisabledError(Exception):
    """No password hash is configured (`ADMIN_AUTH_PASSWORD_HASH`), so nobody can sign in."""


class InvalidPasswordError(Exception):
    pass


class LoginThrottledError(Exception):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(f"too many failed logins; retry in {retry_after_seconds} s")
        self.retry_after_seconds = retry_after_seconds


class NotAuthenticatedError(Exception):
    """No session cookie, or one that names no active session."""


class CsrfTokenError(Exception):
    """A mutating admin request without the session's CSRF token in `X-CSRF-Token`."""
