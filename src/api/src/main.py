import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from container import Container
from proj_logging.logger import get_logger
from routes.health import router as health_router

log = get_logger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
    log.info("Starting API")
    yield


container = Container()

app = FastAPI(lifespan=lifespan)
app.container = container  # type: ignore[attr-defined]


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Log the full traceback server-side; the client only ever sees an opaque 500.
    log.exception("Unhandled exception on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=container.config().app.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)

if __name__ == "__main__":
    # Mirrors the dockerfile CMD: trust X-Forwarded-* only from FORWARDED_ALLOW_IPS.
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        proxy_headers=True,
        forwarded_allow_ips=os.environ.get("FORWARDED_ALLOW_IPS", "127.0.0.1"),
    )
