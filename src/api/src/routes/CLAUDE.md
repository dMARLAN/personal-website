# Routes

Routes handle HTTP only: parse the request, call one service method, return its result. Business rules live in
services.

- One directory per route group: `route.py` (the `router`) and `types.py` for request/response models.
- Prefixes are set in `main.py` (`/api/content`, `/api/admin/...`). The public ingress blocks `/api/admin`, so
  admin routes must live under it.
- **Every route sets an explicit camelCase `operation_id`.** It names the generated frontend client function
  (`npm run openapi:gen`), so keep it stable and unique.
- Add each route module to `Container.wiring_config`.
- Service errors map to HTTP in `errors.py` (one table). Do not raise `HTTPException` from services.
- Admin auth is a dependency (`auth/admin.py`): `require_admin` for reads, `require_admin_write` (session +
  `X-CSRF-Token`) for anything that changes state.
- ETag helpers and the public `Cache-Control` value are in `http_cache.py`.
- `admin/content/route.py` has one explicit GET/PUT pair per section, so OpenAPI types each document exactly. A new
  section needs its pair there and in `admin/drafts/route.py`, a field in `Drafts`
  (`services/content/types.py`), a `SectionSpec` in `content/sections.py`, and a seed document.
- `errors.py` also rewrites 422s: a `ContentRuleError` from a model validator gets its field path appended to `loc`.
