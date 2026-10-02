"""FastAPI dependencies that guard /api/admin. Every admin route needs a session; every mutating one also needs CSRF."""

from typing import Annotated, Final

from dependency_injector.wiring import Provide, inject
from fastapi import Cookie, Depends, Header

from container import Container
from repo.types import AdminSessionRecord
from services.auth.service import AuthService

SESSION_COOKIE: Final[str] = "pw_admin_session"
CSRF_HEADER: Final[str] = "X-CSRF-Token"
# The cookie goes only to admin API routes.
SESSION_COOKIE_PATH: Final[str] = "/api/admin"


@inject
async def require_admin(
    auth_service: Annotated[AuthService, Depends(Provide[Container.auth_service])],
    session_token: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> AdminSessionRecord:
    return await auth_service.authenticate(session_token)


async def require_admin_write(
    session: Annotated[AdminSessionRecord, Depends(require_admin)],
    csrf_token: Annotated[str | None, Header(alias=CSRF_HEADER)] = None,
) -> AdminSessionRecord:
    AuthService.check_csrf(session, csrf_token)
    return session


type AdminSession = Annotated[AdminSessionRecord, Depends(require_admin)]
type AdminWriteSession = Annotated[AdminSessionRecord, Depends(require_admin_write)]
