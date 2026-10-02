# API Package

The FastAPI application (`personal-website-api`): the site's content in SQLite, public reads, and the password-guarded
admin API. The contract (endpoints, auth, revalidation) is `docs/design.md` section 13.

## Layout

Routes → services → repos, as in wedding-website. Each layer has a CLAUDE.md; read it before adding code there.

- `src/main.py`: `create_app(container)` builds the app (lifespan: migrate, seed, then serve), error handlers, CORS
  and routers. `python main.py` runs uvicorn (Tilt uses this entrypoint).
- `src/container.py`: the single `dependency-injector` container.
- `src/config/`: `Config` (pydantic-settings). Each group is its own `BaseSettings` with an env prefix (`APP_`,
  `STORAGE_`, `ADMIN_AUTH_`, `REVALIDATE_`). The root `Config` reads no env vars itself. `.env.example` lists them.
- `src/content/`: the Pydantic content schemas and display limits, the API's source of truth.
  See `src/content/CLAUDE.md`.
- `src/seed/`: the documents (and placeholder PDF) a fresh volume starts with.
- `src/db/`: engine and pragmas, table models, Alembic migrations. See `src/db/CLAUDE.md`.
- `src/repo/`, `src/services/`, `src/routes/`, `src/auth/` (admin dependencies): see each CLAUDE.md.
- `src/cli.py`: `migrate`, `backup`, `hash-password`, `revision`, `content-snapshot`
  (`uv run python src/cli.py --help`).

Why no separate `src/db` workspace member, as wedding has: the API is the only consumer, the schema is three tables,
and the seed and migrations validate against the content schemas that live here. A second package would add a
pyproject, Makefile, CI filter and Dockerfile steps without any reuse.

## Dependency Injection

All providers live in `container.py`.

1. Add the provider to `container.py`.
2. If a route uses it, add the route module to `wiring_config`.
3. Use `@inject` and `Provide[Container.provider_name]` in the route handler.

- `Singleton`: one shared instance (config, the DB engine, the HTTP client, the login throttle).
- `Factory`: a new instance per injection (services, repos).

## Testing

`make test` runs pytest (`asyncio_mode = auto`). `tests/conftest.py` gives each test its own data dir, a container
with overridden config, a cheap argon2 hasher and a stubbed revalidation endpoint, plus `client` (HTTPS, so the
Secure cookie round-trips) and `admin` (signed in, with its CSRF token). Override providers instead of patching:

```python
container.some_service.override(fake_service)
```

## Running

- `make run`: the API on :8000 with `src/api/.env` (copy `.env.example`).
- `make backup`: online backup of the local data dir; `make backup-api` at the root backs up the cluster pod.
