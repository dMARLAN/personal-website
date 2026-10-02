# personal-website

Chad's personal website, to be served at <https://chad.hambley.org>.

The site is an F/A-18C Hornet DDI (digital display indicator), designed in [`docs/design.md`](docs/design.md). Its
content is edited in `/admin` and stored by the API in SQLite (design section 13).

## Architecture

| Package | Stack | What it is |
|---|---|---|
| `src/api` | FastAPI, `dependency-injector`, pydantic-settings, SQLAlchemy + Alembic on SQLite | The API (`personal-website-api`), a uv workspace member: content storage and validation, admin auth, the resume PDF. |
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

## Admin and content data

- Admin login needs an argon2 hash of the password: `make -C src/api hash-password`. For Tilt, export it as
  `ADMIN_AUTH_PASSWORD_HASH` before `make tilt-up`; in production it goes in the `personal-website-api-secrets`
  Secret (template: `k8s/api/secret.example.yaml`). The session cookie is `Secure`, so sign in over `localhost`
  or HTTPS.
- The API keeps `site.db` (SQLite, WAL) and `resume.pdf` on its data volume (`STORAGE_DATA_DIR`; a PVC in the
  cluster). A fresh volume is seeded with the placeholder content.
- **Backups.** `make backup-api` takes an online backup from the API pod in the current kube context into
  `./backups/<timestamp>/`. It runs `cli.py backup` in the pod, which uses SQLite's online backup API (what
  `sqlite3 site.db ".backup out.db"` does), so it is consistent while the API serves, and copies `resume.pdf` too.
  Outside the cluster, `make -C src/api backup` backs up the data dir in `src/api/.env`. To restore, stop the API,
  put the backup in place as `site.db` (removing any `site.db-wal` and `site.db-shm`), and start it again.

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
| `make backup-api` | Online backup of the API's database and resume PDF from the cluster into `./backups`. |

## Bezel materials

The bezel face, OSB caps, BRT/CONT knobs and the lip ring round the glass are baked images in
`src/frontend/public/materials/` (design §4.5). `scripts/materials/` rebuilds them; the first run downloads the
source textures into `scripts/materials/.sources/` (gitignored):

```bash
uv run --no-project --with numpy --with pillow python scripts/materials/bake_all.py
```

The bezel materials are derived from CC0 textures by [ambientCG](https://ambientcg.com) (Lennart Demes), under
[CC0 1.0 Universal](https://docs.ambientcg.com/license/):

| Set | Used for |
|---|---|
| [Metal029](https://ambientcg.com/a/Metal029) | Bezel paint grain, normals and roughness |
| [PaintedMetal002](https://ambientcg.com/a/PaintedMetal002) | Bezel wear: chips and scratches |
| [Plastic012A](https://ambientcg.com/a/Plastic012A) | OSB caps |
| [Metal027](https://ambientcg.com/a/Metal027) | Knob coat |

Each set's 1K-JPG download is `https://ambientcg.com/get?file=<Set>_1K-JPG.zip`. The knurl, flutes, cap bevels,
wells and lip profile are procedural. No DCS texture went into any asset; DCS was only a visual reference.

## Deployment

Production images are built on the home server without a registry, as wedding-website does. The API image comes from
`src/api/dockerfiles/base.Dockerfile`, and the frontend image is the `runner` stage of
`dockerfiles/frontend.Dockerfile`. The homeserver stack for this site does not exist yet.
