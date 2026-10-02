# personal-website scaffold blueprint

Research date: 2026-10-02. Sources (read-only):

- `~/PycharmProjects/wedding-website` at `773eae3` on `master`
- `~/PycharmProjects/homeserver`, specifically `k8s/wedding/`, `Makefile`, and `scripts/host-setup.sh`
- `~/PycharmProjects/agent-library/configs/personal-website.toml`

The goal is a bare-minimum skeleton that copies wedding-website's patterns: a uv workspace with one Python
package (`src/api`), a Next.js App Router app (`src/frontend`), Tilt on kind via ctlptl, Makefiles that fan out,
and a homeserver k3s stack. There is no database.

---

## 1. wedding-website as it is today

### 1.1 Repo layout (tracked files, excluding wedding feature code)

```
.claude/skills/{backend,bash,frontend,general,python,theme,uv}/SKILL.md   # repo-owned, committed
.github/workflows/pr_checks.yml
.gitignore
Brewfile
CLAUDE.md
Makefile                      # root fan-out
README.md
Tiltfile
dockerfiles/frontend.Dockerfile
k8s/ctlptl.yaml
k8s/namespace.yaml
k8s/api/{configmap,deployment,service,photos-pvc}.yaml
k8s/frontend/{deployment,service,secret.dev.example}.yaml
k8s/mailpit/...  k8s/postgres/...                                           # wedding-specific
pyproject.toml                # uv workspace root + Black/Ruff/Pyright config
pytest.ini
uv.lock
scripts/{bootstrap.sh,format-py.sh,format-ts.sh}
src/api/                      # wedding-api (FastAPI)
  CLAUDE.md  Makefile  pyproject.toml  dockerfiles/base.Dockerfile
  src/{main.py,container.py,config/,routes/,services/,repo/,auth/,middleware/,proj_logging/}
  tests/
src/db/                       # wedding-db (SQLAlchemy + Alembic), wedding-specific
src/frontend/                 # Next.js, outside the uv workspace
  .dockerignore .env.example .gitignore .node-version CLAUDE.md Makefile
  components.json eslint.config.mjs next.config.ts package.json package-lock.json
  postcss.config.mjs tsconfig.json vitest.config.mts
  public/  src/{app,components,content,hooks,lib,stores,test}/
```

### 1.2 Root `pyproject.toml` (verbatim)

```toml
[project]
name = "wedding-website"
version = "0.1.0"
description = "Wedding website - RSVP, event info, and photo galleries for guests"
readme = "README.md"
requires-python = ">=3.14"
dependencies = []

[tool.uv.workspace]
members = ["src/api", "src/db"]

[dependency-groups]
dev = [
    "black>=25.12.0",
    "httpx>=0.28.1",
    "pyright>=1.1.407",
    "pytest>=9.0.2",
    "pytest-asyncio>=1.3.0",
    "ruff>=0.14.10",
]

[tool.black]
line-length = 120
target-version = ["py314"]

[tool.pyright]
include = ["src"]

[tool.ruff]
target-version = "py314"

[tool.ruff.lint]
select = [
    "A",   # built-in shadowing
    "ANN", # type annotations
    "ISC", # implicit/explicit string concatenation
    "RET", # returns
    "SIM", # simplify
    "ARG", # unused args
    "PTH", # use pathlib
    "C90", # high complexity
    "E",   # code style
    "F",   # pyflakes
    "PLE", # errors
    "PLR", # refactoring
    "UP",  # pyupgrade
    "UP042", # Use (StrEnum) instead of (str, Enum)
    "UP007", # Use X | Y instead of Union[X, Y]
    "UP045", # Use X | None instead of Optional[X]
]
ignore = [
    "RET501", # unnecessary-return-none
    "E501",   # line too long (handled by Black)
]
preview = true
fixable = ["E", "F401"]
unfixable = []
mccabe.max-complexity = 10
```

`uv.lock` header: `version = 1`, `revision = 3`, `requires-python = ">=3.14"`. Local tools on this machine:
uv 0.12.22 and Python 3.14.4. CI pins uv `0.11.19`.

Root `pytest.ini` contains `[pytest]` and `pythonpath = "src"`.

### 1.3 `src/api/pyproject.toml`

```toml
[project]
name = "wedding-api"
version = "0.1.0"
description = "Wedding website API"
requires-python = ">=3.14"
dependencies = [ ...wedding deps..., "dependency-injector>=4.48.3", "fastapi>=0.126.0",
  "pydantic>=2.12.5", "pydantic-settings>=2.12.0", "uvicorn>=0.38.0", "wedding-db" ]

[tool.uv.sources]
wedding-db = { workspace = true }

[tool.pytest.ini_options]
pythonpath = ["src"]
addopts = ["--import-mode=importlib"]
```

The generic dependencies a minimal API keeps are `fastapi`, `uvicorn`, `pydantic`, `pydantic-settings`, and
`dependency-injector`. Everything else (`aiosmtplib`, `css-inline`, `jinja2`, `pillow`, `pyjwt`,
`python-multipart`, `qrcode`, `sqlalchemy`, `anyio`, `wedding-db`) is wedding-specific.

### 1.4 Makefiles

The root `Makefile` declares `.PHONY` for every target. Each verb has one sub-target per package, and an
aggregate target depends on all of them:

```make
install-api:
	cd src/api && make install
install-frontend:
	cd src/frontend && make install
install: \
  install-api \
  install-frontend
# ...the same shape for format, format_diff, validate, and ci...

bootstrap:
	./scripts/bootstrap.sh
system-deps:
	HOMEBREW_NO_INSTALL_CLEANUP=1 brew bundle
local-cluster: system-deps
	ctlptl apply -f k8s/ctlptl.yaml
tilt-up: local-cluster
	tilt up
tilt-down: local-cluster
	tilt down
tilt-reset: tilt-down tilt-up
```

`src/api/Makefile` (verbatim, apart from the image name):

```make
.PHONY: lock install format_diff format validate ci

API_IMAGE_NAME := wedding-website-api
PROJECT_ROOT := $(abspath $(CURDIR)/../..)
API_DIR := $(PROJECT_ROOT)/src/api
API_DOCKERFILE := $(API_DIR)/dockerfiles/base.Dockerfile
BUILD_CONTEXT := $(PROJECT_ROOT)

lock:
	uv lock

install: lock
	uv sync --all-packages --group dev

build:
	docker build -t $(API_IMAGE_NAME) -f $(API_DOCKERFILE) $(BUILD_CONTEXT)

format_diff:
	$(PROJECT_ROOT)/scripts/format-py.sh --diff --dir $(API_DIR)/src

format:
	$(PROJECT_ROOT)/scripts/format-py.sh --dir $(API_DIR)/src

test:
	uv run -- pytest

validate: install format_diff test
	uv run --frozen ruff check src
	uv run --frozen -- pyright src

ci: validate build
	echo "CI checks passed"
```

`src/frontend/Makefile` (verbatim):

```make
.PHONY: install format_diff format validate ci build

PROJECT_ROOT := $(abspath $(CURDIR)/../..)
FRONTEND_DIR := $(PROJECT_ROOT)/src/frontend

install:
	npm install

format_diff:
	$(PROJECT_ROOT)/scripts/format-ts.sh --diff --dir $(FRONTEND_DIR)/src

format:
	$(PROJECT_ROOT)/scripts/format-ts.sh --dir $(FRONTEND_DIR)/src

build:
	npm run build

validate: install format_diff
	npm run lint
	npm run typecheck
	npm run test

ci: validate build
	echo "CI checks passed"
```

### 1.5 Scripts

- `scripts/format-py.sh` parses `--diff` and `--dir <path>`, then `cd`s into the directory and runs
  `uv run -- black --line-length=120 --target-version=py314 .`. In diff mode it adds
  `--diff --check --color`, prints "please run `make format`", and exits 1. Copy it verbatim.
- `scripts/format-ts.sh` has the same argument parsing and runs `npx prettier --check "**/*.{ts,tsx}"` or
  `npx prettier --write "**/*.{ts,tsx}"`. Prettier uses its defaults, because there is no `.prettierrc`.
  Copy it verbatim.
- `scripts/bootstrap.sh` installs Homebrew if it is missing (and sets up the Linuxbrew shellenv in
  `~/.bashrc` and `~/.zshrc`), then runs `brew bundle` and `uv sync`.
- `Brewfile` contains `gcc`, `uv`, `kind`, `tilt`, `ctlptl`, and `kubectl`. It does not install Docker or Node.

### 1.6 `k8s/ctlptl.yaml` (verbatim)

```yaml
apiVersion: ctlptl.dev/v1alpha1
kind: Registry
name: ctlptl-registry
port: 5005
---
apiVersion: ctlptl.dev/v1alpha1
kind: Cluster
product: kind
name: kind-wedding
registry: ctlptl-registry
```

`k8s/namespace.yaml` defines the `wedding` Namespace. The dev manifests are plain manifests with
`image: wedding-api` and `image: wedding-frontend`. Tilt rewrites these image refs.

- **API dev manifests:** `wedding-api-config` ConfigMap (`PYTHONPATH=/app/src/api/src`,
  `FORWARDED_ALLOW_IPS="*"`, `APP_*`, plus DB, mail, and admin values), a Deployment with port 8000 and
  `envFrom: configMapRef`, and a ClusterIP Service on 8000.
- **Frontend dev manifests:** a Deployment with port 3000, `API_INTERNAL_URL=http://wedding-api:8000`, and
  NextAuth secrets from `wedding-frontend-secrets`, plus a ClusterIP Service on 3000.

### 1.7 Tiltfile (summary; source: `wedding-website/Tiltfile`)

1. `load('ext://restart_process', 'docker_build_with_restart')` and `load('ext://uibutton', 'cmd_button', 'text_input')`.
2. Runs `kubectl config use-context kind-wedding` and `allow_k8s_contexts('kind-wedding')`.
3. Reconnects `ctlptl-registry` to the `kind` docker network after Docker restarts (`docker network connect kind ctlptl-registry`).
4. Optional Tailscale sharing: `tailnet_hosts()` reads `tailscale status --self --json`, injects the hosts into
   the API's `APP_CORS_ORIGINS` and the frontend's `ALLOWED_DEV_ORIGINS`, and port-forwards on `0.0.0.0`.
5. API image: `docker_build_with_restart(ref='wedding-api', context='.', dockerfile='src/api/dockerfiles/base.Dockerfile', entrypoint=['uv','run','python','main.py'], live_update=[sync('src/api/src/','/app/src/api/src/'), ...])`.
6. Frontend image: `docker_build_with_restart(ref='wedding-frontend', context='src/frontend', dockerfile='dockerfiles/frontend.Dockerfile', target='dev', entrypoint=['npm','run','dev'], live_update=[sync('src/frontend/src/','/app/src/')])`.
   The `dockerfile` path is relative to the Tiltfile, not to the build context.
7. `k8s_yaml` loads each manifest. `k8s_resource(objects=['wedding:namespace'], new_name='system')`.
   The API resource port-forwards `0.0.0.0:8000:8000` and the frontend port-forwards `0.0.0.0:3000:3000`.
8. If `k8s/frontend/secret.dev.yaml` is missing, Tilt copies it from `secret.dev.example.yaml`.
9. `cmd_button`s: Apply Migrations, Create Migration, and Seed Dev Data (all DB-related), plus Generate Types
   (`npm run openapi:gen`).

### 1.8 Dockerfiles

`src/api/dockerfiles/base.Dockerfile` (build context is the repo root):

```dockerfile
FROM python:3.14-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
COPY ./pyproject.toml ./uv.lock ./
COPY ./src/api/pyproject.toml ./src/api/pyproject.toml
COPY ./src/api/src ./src/api/src
# (+ src/api/scripts and src/db/** in wedding)
ENV UV_LINK_MODE=copy
ENV UV_CACHE_DIR=/root/.cache/uv
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --package wedding-api --frozen --no-dev --no-editable
WORKDIR /app/src/api/src
ENV FORWARDED_ALLOW_IPS="127.0.0.1"
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
```

`dockerfiles/frontend.Dockerfile` (build context is `src/frontend`) has three stages:

- **`dev`:** `node:22-alpine`, `npm ci` with an npm cache mount, `COPY . .`, then `npm run dev`. This is
  Tilt's target.
- **`builder`:** builds from `dev` with `ARG/ENV NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) and
  runs `npm run build`.
- **`runner`:** `node:22-alpine` with `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, and `PORT=3000`. It copies
  `.next/standalone`, `public`, and `.next/static` as `node:node`, sets `USER node`, and runs
  `node server.js`. This depends on `output: "standalone"` in `next.config.ts`.

`src/frontend/.dockerignore` contains `node_modules`, `.next`, `coverage`, `*.tsbuildinfo`, `.env*`, and
`!.env.example`.

### 1.9 Frontend

| Item | Value |
|---|---|
| Node | `src/frontend/.node-version` = `22`, Docker `node:22-alpine`, CI `node-version-file` |
| next | `16.1.0` (exact pin), `eslint-config-next` `16.1.0` |
| react / react-dom | `19.2.3` (exact pin) |
| typescript | `^5` (lock: 5.9.3) |
| tailwindcss + @tailwindcss/postcss | `^4` (lock: 4.3.2) |
| tw-animate-css | `^1.4.0` |
| eslint | `^9` (lock: 9.39.5) |
| prettier | `^3.6.0` (lock: 3.9.5) |
| vitest | `^3.2.0` (lock: 3.2.7), plus `@vitejs/plugin-react ^5`, `jsdom ^26`, `@testing-library/react ^16.3`, `@testing-library/jest-dom ^6.6` |
| shadcn deps | `radix-ui ^1.6.2`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `tailwind-merge ^3.4.0`, `lucide-react ^0.562.0` |
| typed API client | `openapi-fetch ^0.17.0`, `openapi-typescript ^7.10.1` (dev), `openapi-react-query ^0.5.0`, `@tanstack/react-query ^5.90` |
| @types | `@types/node ^20`, `@types/react ^19`, `@types/react-dom ^19` |

`package.json` scripts (verbatim):

```json
"dev": "next dev --hostname 0.0.0.0",
"build": "next build",
"start": "next start",
"lint": "eslint",
"typecheck": "tsc --noEmit",
"test": "vitest run",
"openapi:gen": "openapi-typescript http://localhost:8000/openapi.json -o src/lib/api/schema.ts"
```

The config files are short. Copy them verbatim:

- `postcss.config.mjs`: `const config = { plugins: { "@tailwindcss/postcss": {} } }; export default config;`
- `eslint.config.mjs`: flat config. `defineConfig([...nextVitals, ...nextTs, globalIgnores([".next/**","out/**","build/**","next-env.d.ts"])])`,
  with imports from `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- `tsconfig.json`: the create-next-app default. It sets `target ES2017`, `strict`, `moduleResolution bundler`,
  `jsx react-jsx`, the `next` plugin, and `paths {"@/*": ["./src/*"]}`. `include` lists `next-env.d.ts`,
  `**/*.ts(x)`, `.next/types/**/*.ts`, `.next/dev/types/**/*.ts`, and `**/*.mts`.
- `components.json` (shadcn): `style "new-york"`, `rsc true`, `tsx true`,
  `tailwind.config ""` (which means Tailwind v4 CSS-first), `css "src/app/globals.css"`,
  `baseColor "neutral"`, `cssVariables true`, `iconLibrary "lucide"`. Aliases:
  `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, and `@/hooks`.
- `vitest.config.mts`: `plugins [react()]`, an alias from `@` to `./src`, `environment "jsdom"`,
  `setupFiles ["src/test/setup.ts"]`, and `passWithNoTests: true`.
- `src/test/setup.ts`: imports `@testing-library/jest-dom/vitest` and adds an in-memory
  `localStorage`/`sessionStorage` shim, because Node 22 has a built-in localStorage that shadows jsdom's.
- `src/lib/utils.ts`: the shadcn `cn()` helper, `twMerge(clsx(inputs))`.
- `next.config.ts`: `output: "standalone"`, plus `allowedDevOrigins` read from the comma-separated
  `ALLOWED_DEV_ORIGINS` env var. The `images.remotePatterns` and redirects in it are wedding-specific.

Tailwind v4 is CSS-first, and there is no `tailwind.config.*`. `src/app/globals.css` starts with
`@import "tailwindcss"; @import "tw-animate-css";` and then has an `@theme inline { --color-*: var(--*) ... }`
block that maps shadcn tokens to CSS variables (1083 lines, mostly wedding theme). For the skeleton, use the
stock `globals.css` that `npx shadcn@latest init` generates.

API client pattern (`src/lib/api/client.ts`): `createClient<paths>({ baseUrl: apiBaseUrl() })`.

- **Server-side:** `apiBaseUrl()` uses `API_INTERNAL_URL` (`http://<svc>:8000`).
- **Browser:** it uses `NEXT_PUBLIC_API_URL`, which is inlined at build time, and falls back to
  `http://${location.hostname}:8000`.

The wedding identity middleware is wedding-specific.

### 1.10 FastAPI skeleton

- **`src/main.py`:**
  - Builds `container = Container()` and `app = FastAPI(lifespan=lifespan)`, then sets
    `app.container = container  # type: ignore[attr-defined]`.
  - Has a global `@app.exception_handler(Exception)` that logs and returns an opaque 500.
  - Adds `CORSMiddleware(allow_origins=container.config().app.cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])`
    and calls `app.include_router(health_router)`.
  - The `__main__` block runs `uvicorn.run(app, host="0.0.0.0", port=8000, proxy_headers=True, forwarded_allow_ips=os.environ.get("FORWARDED_ALLOW_IPS", "127.0.0.1"))`.
    Tilt's entrypoint `python main.py` relies on this block.
- **`src/container.py`:** `class Container(containers.DeclarativeContainer)` declares `wiring_config =
  containers.WiringConfiguration(modules=["routes.health", ...])` and
  `config: providers.Singleton[Config] = providers.Singleton(Config)`. Repos and services are `Factory` providers.
- **`src/config/__init__.py`:** `class Config(BaseSettings)` with nested groups such as
  `app: AppConfig = Field(default_factory=AppConfig)`. `settings_customise_sources` returns only
  `(init_settings,)` so that the root config never reads bare env vars.
- **`src/config/_app.py`:** `AppConfig(BaseSettings)` with `env_prefix="APP_"`,
  `frontend_base_url: str = "http://localhost:3000"`, and
  `cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]`. The k8s ConfigMap
  supplies `cors_origins` as JSON.
- **`src/routes/health.py`:** `router = APIRouter()` and
  `@router.get("/health", operation_id="healthCheck") async def health() -> dict[str, str]: return {"status": "ok"}`.
  Every route declares an explicit `operation_id`, because it feeds the openapi-typescript codegen.
- **`src/proj_logging/{logger.py,settings.py}`:** a stdout `logging.Logger` named by `LoggerSettings(name="WEDDING_WEBSITE", level=INFO)`.
- **`tests/test_health.py`:** an Arrange/Act/Assert test that uses `TestClient(app)`.
- **Layout conventions:** routes, services, and repos each get a directory with `route.py` or `service.py`
  plus a sibling `types.py`, and each layer has a `CLAUDE.md` (`src/api/CLAUDE.md`, `src/api/src/routes/CLAUDE.md`, and so on).
  There are no `__init__.py` files except where they hold logic (`config/__init__.py`).

### 1.11 CI (`.github/workflows/pr_checks.yml`)

- **Trigger:** `on: pull_request` for `branches: [main]` with types `opened` and `synchronize`.
  Permissions are `contents: read` and `pull-requests: read`.
- **`setup`:** `actions/checkout@v6`, then `dorny/paths-filter@v3`, which defines the filters `root`
  (`pyproject.toml`, `uv.lock`, `Makefile`, `scripts/**`, `.github/workflows/**`), `api`, `db`, and
  `frontend` (`src/frontend/**`, `dockerfiles/**`).
- **`api-ci`:** `astral-sh/setup-uv@v7` (`version: "0.11.19"`, `enable-cache: true`), then `make ci` in `./src/api`.
- **`frontend-ci`:** `actions/setup-node@v4` (`node-version-file: src/frontend/.node-version`, `cache: npm`,
  `cache-dependency-path: src/frontend/package-lock.json`), then `make ci` in `./src/frontend`.
- **`check`:** runs `re-actors/alls-green@release/v1` with `allowed-skips` set to the job names.
- **Bug to avoid:** the workflow filters on `main`, but the repo's default branch is `master`. Use `master` in
  personal-website, since HANDOFF.md says that is the default branch.

### 1.12 How CLAUDE.md references skills

wedding-website commits its own skills under `.claude/skills/<name>/SKILL.md`. It ignores agent-library
symlinks with `.claude/skills/*` and then re-includes each repo-owned skill with `!.claude/skills/backend/**`
lines. The root `CLAUDE.md` references skills in two ways:

- **Hard imperatives:** `- IMPORTANT: Always read and adhere to ALL rules defined in `.claude/skills/general/SKILL.md``,
  repeated for `python` and `bash`.
- **Index:** a `# Skills` section with Markdown links such as `- [Python](.claude/skills/python/SKILL.md): ...`.

`src/frontend/CLAUDE.md` points at `../../.claude/skills/frontend/SKILL.md` with the same IMPORTANT
phrasing. The root CLAUDE.md also contains a repo-overview table, "Running Locally", "Makefile Targets", and a
rule to run `uv run make validate` before finishing.

---

## 2. What to drop for a minimal, database-free personal site

| Area | Wedding item | Action |
|---|---|---|
| DB | `src/db` package (SQLAlchemy, Alembic, seeds), workspace member and CI job | Drop. The workspace has only `src/api`. |
| DB | `k8s/postgres/*`, `DB_*` config, the Tilt migration/seed buttons, `resource_deps=['postgres']` | Drop |
| DB | Dockerfile `COPY src/db ...` lines | Drop |
| Mail | `k8s/mailpit/*`, `EMAIL_*` and `MAIL_*` config, the `services/email`, `inbox`, and `save_the_date` code, `aiosmtplib`, `jinja2`, `css-inline` | Drop |
| Uploads | `photos-pvc`, `PHOTOS_ROOT_DIR`, `middleware/upload_size.py`, `pillow`, `python-multipart`, `qrcode` | Drop |
| Admin auth | `next-auth`, `jose`, `pyjwt`, `auth/`, `k8s/frontend/secret.dev*.yaml`, the `AUTH_*` and `ADMIN_*` env vars, the secret auto-copy in the Tiltfile | Drop |
| Wedding UI | theme skill, decor, music, RSVP, gallery, admin, `@dnd-kit`, `@tanstack/react-table`, `zustand`, `react-hook-form`, `zod`, `sonner`, `msw` | Drop |
| Repos/services | `repo/`, `services/` with their CLAUDE.md files, `rate_limit` | Drop. Recreate the layer directories when they first have content. |
| next.config | `images.remotePatterns` and redirects | Drop. Keep `output: "standalone"` and `allowedDevOrigins`. |
| Optional | Tailscale dev sharing in the Tiltfile | Keep or drop. It is generic but not minimal. |
| Optional | TanStack Query and `openapi-react-query` | Drop unless client-side fetching is needed. A server-component fetch with `openapi-fetch` is enough. |

---

## 3. homeserver: how wedding is deployed

### 3.1 Mechanics

- **Cluster:** single-node k3s with the bundled Traefik ingress and ServiceLB (klipper). Every command uses
  `${KUBECTL}`, which defaults to `kubectl --context homeserver`, because the current kubectl context on the
  machine may be a dev kind cluster.
- **There is no registry and no pull auth.** `k8s/wedding/build-images.sh <repo-dir>` does the following:
  1. Runs `git archive HEAD` from a local checkout of the app repo into a temp dir, so it builds the committed
     tree and not the working copy.
  2. Runs `docker build` for each image (`wedding-api:prod` with the repo-root context; `wedding-frontend:prod`
     with `--build-arg NEXT_PUBLIC_API_URL=https://api.chadandjanina.wedding` and context `src/frontend`).
  3. Imports each image with `docker save <img> | sudo k3s ctr -n k8s.io images import -`.

  The manifests reference `docker.io/library/<name>:prod` with `imagePullPolicy: Never`. The root README's
  mention of "image pull auth" is stale, because wedding uses no pull secret.
- **TLS:** `k8s/wedding/setup-cert-manager.sh` installs cert-manager `v1.18.2` from the release YAML and applies
  `cluster-issuer.yaml`. That is a **ClusterIssuer `letsencrypt`** (ACME prod, email `chad@spiralup.co`, key
  secret `letsencrypt-account-key`, `http01.ingress.ingressClassName: traefik`). It is cluster-scoped and
  already installed, so a new stack reuses it and does not re-run the script.
- **Ingress:** `ingress.yaml` is a `networking.k8s.io/v1` Ingress.
  - Annotations: `cert-manager.io/cluster-issuer: letsencrypt` and
    `traefik.ingress.kubernetes.io/router.middlewares: wedding-redirect-https@kubernetescrd`.
  - `ingressClassName: traefik`, and one `tls` entry that lists every host with `secretName: wedding-tls`.
  - Rules: apex and `www` go to `wedding-frontend:3000`; `api.` goes to `wedding-api:8000`.
- **HTTP to HTTPS redirect:** `redirect-https.yaml` is a namespaced Traefik `Middleware`
  (`traefik.io/v1alpha1`, `redirectScheme: {scheme: https, permanent: true}`). ACME HTTP-01 still works,
  because the solver's own Ingress has a longer path.
- **`traefik-timeouts.yaml`:** a cluster-wide `HelmChartConfig` (kube-system) that disables `readTimeout`
  for uploads. It already exists, and a new stack does not touch it.
- **Secrets:** `k8s/wedding/secrets.example.yaml` is committed and `k8s/wedding/secrets.yaml` is gitignored.
  `deploy.sh` refuses to run without `secrets.yaml` and applies it. The homeserver repo is public.
- **Deploy script order** (`deploy.sh`): namespace → PVs → secrets → configmap → postgres (waits) → migrate Job
  → mail → api → frontend → redirect middleware → ingress → traefik config → backup CronJob → print URLs.
  The script is idempotent.
- **Makefile:**
  - Top-level settings: `KUBECTL ?= kubectl --context homeserver` and
    `WEDDING_REPO ?= ${HOME}/PycharmProjects/wedding-website`.
  - `wedding-build`, `wedding-restart`, `wedding-up`/`down`, and `teardown-wedding` do what their names say.
    `wedding-restart` runs `rollout restart` and then `rollout status --timeout=180s`.
  - `deploy-wedding` depends on `host-check`.
  - `wedding-redeploy` depends on `host-check` and runs `git pull --ff-only`, then build, migrate, and restart.
- **Host setup:** `scripts/host-setup.sh check|apply`, called through `make host-check` and `make host-setup`.
  - `check` verifies that k3s is active and the `homeserver` kube context exists.
  - With ufw active, `check` also verifies the rule `ufw route allow to 10.42.0.0/16`. Without that rule,
    ufw-docker drops traffic to the k3s pods whenever dockerd runs (for example, during `tilt up`).
  - The script is stack-agnostic, so nothing new is needed for personal-website.
- **Production env differences:**
  - The API ConfigMap sets `FORWARDED_ALLOW_IPS: "*"`, `APP_FRONTEND_BASE_URL`, and `APP_CORS_ORIGINS` as a
    JSON list.
  - The frontend sets `NEXT_PUBLIC_API_URL` (server side) and `API_INTERNAL_URL: http://wedding-api:8000`.
  - Both production Deployments carry the `labels: app: ...` metadata.

### 3.2 What a new `k8s/personal-website/` stack needs

```
k8s/personal-website/
  README.md                 # prerequisites, build, deploy (trimmed copy of the wedding README)
  namespace.yaml            # Namespace personal-website
  build-images.sh           # git archive HEAD → docker build api + frontend (bake NEXT_PUBLIC_API_URL) → k3s ctr import
  deploy.sh                 # namespace → api configmap → api → frontend → redirect-https → ingress
  api/configmap.yaml        # PYTHONPATH=/app/src/api/src, FORWARDED_ALLOW_IPS="*", APP_CORS_ORIGINS='["https://<domain>","https://www.<domain>"]'
  api/deployment.yaml       # docker.io/library/personal-website-api:prod, imagePullPolicy: Never, :8000
  api/service.yaml
  frontend/deployment.yaml  # docker.io/library/personal-website-frontend:prod, Never, :3000, API_INTERNAL_URL=http://personal-website-api:8000
  frontend/service.yaml
  redirect-https.yaml       # Middleware redirect-https in namespace personal-website
  ingress.yaml              # annotation personal-website-redirect-https@kubernetescrd, cluster-issuer letsencrypt,
                            # tls secretName personal-website-tls, hosts <domain>, www.<domain>, api.<domain>
```

The stack has no PVs, secrets, migrate Job, or backup CronJob. `deploy.sh` should not require `secrets.yaml`.

Makefile additions:

- `PERSONAL_WEBSITE_REPO ?= ${HOME}/PycharmProjects/personal-website`
- `personal-website-build`
- `deploy-personal-website: host-check`
- `personal-website-restart` (`rollout restart` and `rollout status` for both deployments)
- `personal-website-redeploy: host-check` (pull, build, restart; no migrate step)
- `personal-website-up` and `personal-website-down`
- `teardown-personal-website`
- `.PHONY` entries for all of the above

Root `README.md`: add a "Stacks" bullet for the new stack.

**Optional cleanup:** `cluster-issuer.yaml` and `setup-cert-manager.sh` live under `k8s/wedding/`, but they
are shared cluster infrastructure. Moving them to something like `k8s/cluster/` is optional and out of scope
for the skeleton.

### 3.3 External prerequisites

1. **Domain.** One needs to be bought or chosen. The wedding domain is registered at Namecheap.
2. **DNS.** Create A records for `@`, `www`, and (if you keep a public API subdomain) `api`, all pointing at
   the home public IP. The wedding docs show `50.72.88.183` on Shaw, which may be dynamic, so confirm it.
3. **Port forwarding.** Ports 80 and 443 are already forwarded to the k3s node for wedding, and Traefik routes
   by host, so nothing new is needed. CGNAT is not an issue, because the wedding site already works.
4. **cert-manager and the ClusterIssuer.** Both are already installed. A certificate is issued automatically
   once DNS resolves.
5. **App checkout on the server.** Clone personal-website onto the server (wedding uses
   `/home/marlan/...`). `build-images.sh` needs `sudo` for `k3s ctr`.

---

## 4. agent-library

`configs/personal-website.toml` enables these skills:

- `docs/{design-doc,html,make-doc,mermaid}`
- `general/{git-pr,handoff,review-swarm,rules,skill-create}`
- `language/{python,typescript,uv}`
- `tooling/{docker,gh,linear,sandboxed-network-access}`

It also enables the fragments `writing-style` and `engineering-principles`. The skills are symlinked into
`.claude/skills/` and `.agents/skills/`, and the fragments into `.claude/fragments/`. All of these are
gitignored. The config file is in `.git/info/exclude` and must never be committed.

Skills that matter for scaffolding:

- **`python`:** Python 3.14 and its rules. It says to validate with `uv run pyright`,
  `uv run ruff check --fix`, and `uv run ruff format`. **Conflict:** wedding formats with Black. The brief
  says to keep the shared Black/Ruff config, so the CLAUDE.md should state that `make format` (Black) is
  authoritative.
- **`uv`:** workspace conventions (`uv add <pkg> --package <member>`, never hand-edit deps). Its examples
  mention `spiral-api-v2`, but they are generic.
- **`typescript`:** rules for `any`, weak types, union types, and shadcn over antd.
- **`docker`:** a long generic reference (1036 lines). It matters little for this skeleton.
- **`rules`:** the language-agnostic rules. This is the equivalent of wedding's `general` skill.
- **`git-pr`, `gh`, `handoff`:** workflow skills.

**Gaps compared with wedding:** there is no synced `frontend`, `backend`, or `bash` skill. Either add small
repo-owned skills (with `!.claude/skills/<name>/**` re-includes in `.gitignore`, as wedding does) or put the
conventions in `CLAUDE.md` and `src/*/CLAUDE.md`.

`CLAUDE.md` must import the fragments, as HANDOFF.md requires:

```
@.claude/fragments/writing-style.md
@.claude/fragments/engineering-principles.md
```

---

## 5. Proposed minimal personal-website tree

```
.github/workflows/pr_checks.yml     # setup(paths-filter: root/api/frontend) + api-ci + frontend-ci + check; branches: [master]
.gitignore                          # existing + .next/, out/, __pycache__/, .pytest_cache/, .ruff_cache/, *.tsbuildinfo
Brewfile                            # uv, kind, tilt, ctlptl, kubectl (gcc optional)
CLAUDE.md                           # fragment imports, overview table, skill links, `uv run make validate` rule
Makefile                            # install/format/format_diff/validate/ci fan-out to api + frontend; bootstrap, system-deps, local-cluster, tilt-up/down/reset
README.md
Tiltfile                            # kind-personal-website context, registry reattach, 2 docker_build_with_restart, k8s_yaml, port-forwards 3000/8000, Generate Types button
dockerfiles/frontend.Dockerfile     # copy verbatim (node:22-alpine dev/builder/runner)
k8s/ctlptl.yaml                     # Registry ctlptl-registry:5005 (shared with wedding) + Cluster kind-personal-website
k8s/namespace.yaml                  # personal-website
k8s/api/{configmap,deployment,service}.yaml      # image personal-website-api
k8s/frontend/{deployment,service}.yaml           # image personal-website-frontend, API_INTERNAL_URL=http://personal-website-api:8000
pyproject.toml                      # name personal-website, members ["src/api"], same dev group + Black/Ruff/Pyright
pytest.ini
uv.lock                             # generated
scripts/{bootstrap.sh,format-py.sh,format-ts.sh}  # verbatim
src/api/
  CLAUDE.md                         # DI container notes (trimmed copy)
  Makefile                          # verbatim, API_IMAGE_NAME := personal-website-api
  pyproject.toml                    # personal-website-api: fastapi, uvicorn, pydantic, pydantic-settings, dependency-injector
  dockerfiles/base.Dockerfile       # copy minus src/db + scripts lines; --package personal-website-api
  src/main.py                       # FastAPI + lifespan + exception handler + CORS + health router + __main__ uvicorn
  src/container.py                  # wiring ["routes.health"], config Singleton
  src/config/__init__.py            # Config(app: AppConfig), init_settings only
  src/config/_app.py                # APP_ prefix, frontend_base_url, cors_origins
  src/routes/health.py
  src/proj_logging/{logger.py,settings.py}  # name "PERSONAL_WEBSITE"
  tests/test_health.py
src/frontend/                       # create-next-app (TS, App Router, src/, Tailwind, ESLint) + shadcn init
  .dockerignore .env.example .gitignore .node-version(22) CLAUDE.md Makefile
  components.json eslint.config.mjs next.config.ts(standalone, allowedDevOrigins) package.json package-lock.json
  postcss.config.mjs tsconfig.json vitest.config.mts
  src/app/{layout.tsx,page.tsx,globals.css}
  src/lib/utils.ts
  src/lib/api/{client.ts,schema.ts}   # openapi-fetch; schema generated by `npm run openapi:gen`
  src/test/setup.ts
```

Notes for the builder:

- **Name collisions.** Wedding's kind cluster uses ports 3000 and 8000, so stop one Tilt before starting the
  other. The ctlptl registry `ctlptl-registry:5005` is shared safely between clusters.
- **Node is not installed.** Install it via nvm first (see HANDOFF.md), and match `.node-version`.
- **Docker.** It is needed in WSL (Docker Desktop with WSL integration, or native dockerd). Brewfile does not
  install it.
- **Package versions.** Pin `next` and `eslint-config-next` exactly, and pin `react`/`react-dom` exactly, as
  wedding does.

---

## 6. Open questions for Chad

1. **Domain.** What is the domain, and is it bought yet? Which registrar and DNS host?
2. **Public API subdomain or not.** Wedding exposes `api.<domain>` and bakes it into the client bundle. A
   thin, mostly server-called API could instead stay cluster-internal (frontend calls it via
   `API_INTERNAL_URL`), or be routed under `/api` on the apex. Either option drops a DNS record and a TLS host.
3. **Registry.** Keep wedding's no-registry approach (build on the server, `k3s ctr import`,
   `imagePullPolicy: Never`), or build in CI and push to something like GHCR with a pull secret? The
   no-registry approach is the "copy the familiar pattern" answer.
4. **Next.js and Node versions.** Pin Next `16.1.0` with Node 22 to match wedding, or take the current
   latest at scaffold time, possibly with Node 24 LTS?
5. **Client data fetching.** Include TanStack Query and `openapi-react-query` now, or only `openapi-fetch`?
   Is vitest needed in the skeleton?
6. **Tailscale dev sharing.** Keep it in the Tiltfile?
7. **Skills.** Add repo-owned `frontend`, `backend`, and `bash` skills now, or rely on CLAUDE.md files until
   conventions settle?
8. **Formatter.** Use Black (as wedding does) or `ruff format` (as the synced python skill says)?
