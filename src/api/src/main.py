import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Final

import uvicorn
from anyio import to_thread
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from container import Container
from db.migrate import upgrade
from proj_logging.logger import get_logger
from routes.admin.auth.route import router as admin_auth_router
from routes.admin.content.route import router as admin_content_router
from routes.admin.resume.route import router as admin_resume_router
from routes.content.route import router as content_router
from routes.errors import register_error_handlers
from routes.health import router as health_router
from routes.resume.route import router as resume_router
from seed.content import SEED_DOCUMENTS

log = get_logger(__name__)

_SEED_RESUME_PDF: Final[Path] = Path(__file__).parent / "seed" / "resume.pdf"


def create_app(container: Container) -> FastAPI:
    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
        log.info("Starting API")
        # One replica owns the SQLite file, so it migrates and seeds before serving.
        await to_thread.run_sync(upgrade, container.config().storage.db_path)
        await container.content_service().seed_missing(SEED_DOCUMENTS)
        container.resume_service().seed_missing(_SEED_RESUME_PDF)
        yield
        await container.http_client().aclose()
        await container.db_context().dispose()

    app = FastAPI(lifespan=lifespan)
    app.container = container  # type: ignore[attr-defined]

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # Log the full traceback server-side; the client only ever sees an opaque 500.
        log.exception(f"Unhandled exception on {request.method} {request.url.path}", exc_info=exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    register_error_handlers(app)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=container.config().app.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(content_router, prefix="/api/content")
    app.include_router(resume_router, prefix="/api")
    app.include_router(admin_auth_router, prefix="/api/admin")
    app.include_router(admin_content_router, prefix="/api/admin/content")
    app.include_router(admin_resume_router, prefix="/api/admin/resume")
    return app


app = create_app(Container())

if __name__ == "__main__":
    # Mirrors the dockerfile CMD: trust X-Forwarded-* only from FORWARDED_ALLOW_IPS.
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        proxy_headers=True,
        forwarded_allow_ips=os.environ.get("FORWARDED_ALLOW_IPS", "127.0.0.1"),
    )
