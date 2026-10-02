# The project is a uv workspace (src/api) + a Next.js frontend (src/frontend)

@.claude/fragments/writing-style.md
@.claude/fragments/engineering-principles.md

- IMPORTANT: Always read and adhere to ALL rules defined in `.claude/skills/rules/SKILL.md`
- IMPORTANT: Always read and adhere to ALL rules defined in `.claude/skills/python/SKILL.md`
- IMPORTANT: Always read and adhere to ALL rules defined in `.claude/skills/typescript/SKILL.md`

# Notes

- When finished making changes, run `uv run make validate` from either the appropriate package or the root. Fix any
  issues before you finish.
- Code, API shapes, and frontend contracts may change freely. Do not add backwards-compatibility shims for them.
- Python is formatted with `ruff format` (line length 120, set in the root `pyproject.toml`). `make format` runs it.
- This project uses **uv** as its package manager. Never use `pip install`. Refer to the `uv` skill
  (`.claude/skills/uv/SKILL.md`) for adding dependencies, running scripts, and workspace conventions.
- The site owner's display name lives only in `src/frontend/src/lib/site.ts` (`SITE_NAME`). Never hardcode it
  elsewhere: the surname is going to change.
- Do not edit `docs/research/`. It holds source research for the upcoming F/A-18C DDI theme.

# Repo Overview

Chad's personal website, served at <https://chad.hambley.org>. It is a skeleton: a placeholder page plus an API that
serves only `GET /health`.

| Path             | What it is                                                                 |
|------------------|----------------------------------------------------------------------------|
| `pyproject.toml` | uv workspace root + shared Ruff/Pyright config (py314, line 120)           |
| `src/api`        | `personal-website-api`: FastAPI application with a DI container            |
| `src/frontend`   | Next.js App Router frontend (outside the uv workspace)                     |
| `k8s/`           | Local-dev Kubernetes manifests (kind cluster via ctlptl)                   |
| `Tiltfile`       | Local dev orchestration: builds images, deploys k8s, Generate Types button |
| `docs/research/` | Research notes for the theme and the scaffold blueprint                    |

# Skills

Synced skills live in `.claude/skills/`. Reference these when working in the relevant area.

- [Rules](.claude/skills/rules/SKILL.md): language-agnostic code quality rules
- [Python](.claude/skills/python/SKILL.md): Python style rules (typing, dataclasses, enums, naming, imports)
- [uv](.claude/skills/uv/SKILL.md): uv workspace structure, dependency management, running code
- [TypeScript](.claude/skills/typescript/SKILL.md): TypeScript type safety and component rules (shadcn)
- [Docker](.claude/skills/docker/SKILL.md): Dockerfile and image reference
- [git-pr](.claude/skills/git-pr/SKILL.md), [gh](.claude/skills/gh/SKILL.md): branches, commits, and pull requests

# Running Locally

- `make bootstrap` installs Homebrew (if missing), system deps, and Python deps.
- `make system-deps` runs `brew bundle`. `make local-cluster` creates the kind cluster. `make tilt-up` starts the
  full local dev environment.

# Makefile Targets

- The root `Makefile` fans out `install`, `format`, `format_diff`, `validate`, and `ci` to `src/api` and
  `src/frontend`. Each package also exposes those targets locally.
