# API Package

The FastAPI application (`personal-website-api`). It currently serves only `GET /health`.

## Layout

- `src/main.py`: builds the app, the global exception handler, CORS, and the routers. `python main.py` runs uvicorn
  (Tilt uses this entrypoint).
- `src/container.py`: the single `dependency-injector` container.
- `src/config/`: `Config` (pydantic-settings). Each group is its own `BaseSettings` with an env prefix
  (`AppConfig` reads `APP_*`). The root `Config` reads no env vars itself.
- `src/routes/`: one module or directory per route group. Every route declares an explicit `operation_id`, because it
  names the generated frontend client functions (`npm run openapi:gen`).
- `src/proj_logging/`: `get_logger(__name__)` returns a stdout logger.

Add `services/` and `repo/` directories when they first have content: routes stay thin, services hold logic, and
repos hold data access.

## Dependency Injection

All providers live in `container.py`.

1. Add the provider to `container.py`.
2. If a route uses it, add the route module to `wiring_config`.
3. Use `@inject` and `Provide[Container.provider_name]` in the route handler.

- `Singleton`: one shared instance (config, clients).
- `Factory`: a new instance per injection (services, repos).

## Testing

`make test` runs pytest. Override providers instead of patching:

```python
app.container.some_service.override(fake_service)
...
app.container.some_service.reset_override()
```
