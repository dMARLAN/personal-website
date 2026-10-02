FROM python:3.14-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

COPY ./pyproject.toml ./uv.lock ./
COPY ./src/api/pyproject.toml ./src/api/pyproject.toml
COPY ./src/api/src ./src/api/src

ENV UV_LINK_MODE=copy
ENV UV_CACHE_DIR=/root/.cache/uv

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --package personal-website-api --frozen --no-dev --no-editable

WORKDIR /app/src/api/src

# Trust X-Forwarded-* headers only from FORWARDED_ALLOW_IPS (uvicorn reads the env var);
# the K3s ingress terminates client connections, so this is how real client IPs reach the app.
ENV FORWARDED_ALLOW_IPS="127.0.0.1"

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
