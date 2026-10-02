from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, Request, Response, status

from auth.admin import SESSION_COOKIE, SESSION_COOKIE_PATH, AdminSession, AdminWriteSession
from container import Container
from routes.admin.auth.types import AdminSessionInfo, LoginRequest
from services.auth.service import SESSION_TTL, AuthService

router = APIRouter()


@router.post(
    "/login",
    operation_id="adminLogin",
    responses={
        status.HTTP_401_UNAUTHORIZED: {"description": "Wrong password."},
        status.HTTP_429_TOO_MANY_REQUESTS: {"description": "Too many failed logins; see `Retry-After`."},
        status.HTTP_503_SERVICE_UNAVAILABLE: {"description": "No admin password hash is configured."},
    },
)
@inject
async def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    auth_service: Annotated[AuthService, Depends(Provide[Container.auth_service])],
) -> AdminSessionInfo:
    # uvicorn resolves the real client from X-Forwarded-For when the peer is a trusted proxy (FORWARDED_ALLOW_IPS).
    if request.client is None:
        raise RuntimeError("the ASGI server reported no client address, so login cannot be rate limited")
    session = await auth_service.login(body.password, request.client.host)
    response.set_cookie(
        SESSION_COOKIE,
        session.token,
        max_age=int(SESSION_TTL.total_seconds()),
        path=SESSION_COOKIE_PATH,
        secure=True,
        httponly=True,
        samesite="strict",
    )
    return AdminSessionInfo(csrf_token=session.csrf_token, expires_at=session.expires_at)


@router.get("/session", operation_id="adminSession")
async def get_session(session: AdminSession) -> AdminSessionInfo:
    return AdminSessionInfo(csrf_token=session.csrf_token, expires_at=session.expires_at)


@router.post("/logout", operation_id="adminLogout", status_code=status.HTTP_204_NO_CONTENT)
@inject
async def logout(
    session: AdminWriteSession,
    response: Response,
    auth_service: Annotated[AuthService, Depends(Provide[Container.auth_service])],
) -> None:
    await auth_service.logout(session)
    response.delete_cookie(SESSION_COOKIE, path=SESSION_COOKIE_PATH, secure=True, httponly=True, samesite="strict")
