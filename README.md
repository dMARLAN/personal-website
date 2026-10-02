# personal-website

Chad's personal website, to be served at <https://chad.hambley.org>.

This is a skeleton. The frontend is one placeholder page with neutral styling, and the API serves only
`GET /health`. The visual design will be an F/A-18C Hornet DDI (digital display indicator) theme, built later from
the research in [`docs/research/`](docs/research/).

## Architecture

| Package | Stack | What it is |
|---|---|---|
| `src/api` | FastAPI, `dependency-injector`, pydantic-settings | The API (`personal-website-api`), a uv workspace member. |
| `src/frontend` | Next.js (App Router), TypeScript, Tailwind v4, shadcn/ui | The site. Talks to the API through a generated `openapi-fetch` client (`npm run openapi:gen`). |

The site owner's display name is set once, in `src/frontend/src/lib/site.ts`.

## Local development

Everything runs in a local kind cluster driven by Tilt.

**Prerequisite: Docker.** The kind cluster needs a running Docker daemon. Everything else comes from the Brewfile.
Node.js 24 is only needed for `make install` / `make validate` outside the cluster.

```bash
make bootstrap   # installs Homebrew (if needed), Brewfile system deps, and uv-syncs Python packages
make tilt-up     # creates the kind cluster (ctlptl) and starts Tilt
```

Tilt builds the API and frontend images with live sync, deploys them into the `personal-website` namespace, and
port-forwards:

- Frontend: <http://localhost:3000>
- API: <http://localhost:8000> (OpenAPI docs at `/docs`)

wedding-website's cluster uses the same ports, so stop one Tilt before starting the other. The `ctlptl-registry`
is shared between the two clusters.

If this machine is on a tailnet, the Tiltfile prints a URL to share the dev site over Tailscale and adds the tailnet
hosts to the API's `APP_CORS_ORIGINS` and the frontend's `ALLOWED_DEV_ORIGINS`.

## Make targets

The root `Makefile` fans out to the packages. Each of `install` / `format` / `format_diff` / `validate` / `ci` also
has per-package variants (`make validate-api`, `make ci-frontend`, ...).

| Target | What it does |
|---|---|
| `make bootstrap` | One-time setup: Homebrew, Brewfile deps (uv, kind, tilt, ctlptl, kubectl), `uv sync`. |
| `make install` | Install deps for both packages (uv sync / npm install). |
| `make format` / `make format_diff` | Apply / check formatting (ruff format + Prettier). |
| `make validate` | Format check, lint (Ruff / ESLint), types (Pyright / tsc), tests (pytest / Vitest). |
| `make ci` | What CI runs: `validate` plus the API Docker build and the frontend production build. |
| `make tilt-up` / `make tilt-down` / `make tilt-reset` | Start / stop / restart the local cluster + Tilt. |

## Deployment

Production images are built on the home server without a registry, as wedding-website does. The API image comes from
`src/api/dockerfiles/base.Dockerfile`, and the frontend image is the `runner` stage of
`dockerfiles/frontend.Dockerfile`. The homeserver stack for this site does not exist yet.
