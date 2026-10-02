"""Maps service-layer errors to HTTP responses, so services stay free of HTTP and routes stay one call long."""

from dataclasses import dataclass
from typing import Final

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from services.auth.types import (
    AdminLoginDisabledError,
    CsrfTokenError,
    InvalidPasswordError,
    LoginThrottledError,
    NotAuthenticatedError,
)
from services.content.types import PreconditionFailedError
from services.resume.types import NotAPdfError, ResumeNotFoundError, ResumeTooLargeError


@dataclass(frozen=True, slots=True)
class _ErrorResponse:
    status_code: int
    detail: str


_ERROR_RESPONSES: Final[dict[type[Exception], _ErrorResponse]] = {
    AdminLoginDisabledError: _ErrorResponse(status.HTTP_503_SERVICE_UNAVAILABLE, "LOGIN_DISABLED"),
    InvalidPasswordError: _ErrorResponse(status.HTTP_401_UNAUTHORIZED, "INVALID_PASSWORD"),
    NotAuthenticatedError: _ErrorResponse(status.HTTP_401_UNAUTHORIZED, "NOT_AUTHENTICATED"),
    CsrfTokenError: _ErrorResponse(status.HTTP_403_FORBIDDEN, "CSRF_TOKEN_INVALID"),
    PreconditionFailedError: _ErrorResponse(status.HTTP_412_PRECONDITION_FAILED, "SECTION_CHANGED"),
    NotAPdfError: _ErrorResponse(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "NOT_A_PDF"),
    ResumeTooLargeError: _ErrorResponse(status.HTTP_413_CONTENT_TOO_LARGE, "FILE_TOO_LARGE"),
    ResumeNotFoundError: _ErrorResponse(status.HTTP_404_NOT_FOUND, "RESUME_NOT_FOUND"),
}


async def _mapped_error(_: Request, error: Exception) -> JSONResponse:
    mapped = _ERROR_RESPONSES[type(error)]
    return JSONResponse(status_code=mapped.status_code, content={"detail": mapped.detail})


async def _throttled(_: Request, error: Exception) -> JSONResponse:
    if not isinstance(error, LoginThrottledError):
        raise TypeError(f"handler registered for LoginThrottledError got {type(error).__name__}")
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "TOO_MANY_ATTEMPTS"},
        headers={"Retry-After": str(error.retry_after_seconds)},
    )


def register_error_handlers(app: FastAPI) -> None:
    for error_type in _ERROR_RESPONSES:
        app.add_exception_handler(error_type, _mapped_error)
    app.add_exception_handler(LoginThrottledError, _throttled)
