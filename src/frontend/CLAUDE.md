# Frontend

Next.js App Router app (outside the uv workspace): the F/A-18C DDI site specified in `docs/design.md`. Phase 1 (frame,
controls, TAC/SUPT menus) is built; `make e2e` runs the Playwright + axe suite.

- IMPORTANT: Always read and adhere to ALL rules defined in
  [`.claude/skills/typescript/SKILL.md`](../../.claude/skills/typescript/SKILL.md).
- The site name and URL live in `src/lib/site.ts`. Use `SITE_NAME` and `SITE_URL`; never hardcode either.
- Tailwind v4 is CSS-first: there is no `tailwind.config.*`. Theme tokens live in `src/app/globals.css` (stock shadcn
  neutral for now). Add shadcn components with `npx shadcn@latest add <name>`; they land in `src/components/ui/`.
- The typed API client is `src/lib/api/client.ts` (`openapi-fetch`). `src/lib/api/schema.ts` is generated: run
  `npm run openapi:gen` against a running API (or the Tilt "Generate Types" button) after API changes.
- The DDI code is in `src/ddi/` (frame, controls, pages registry); content stubs are in `src/content/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
