# Content schemas

One module per site section, each a `ContentModel` (camelCase JSON, unknown keys rejected). They are the API's
source of truth: the frontend generates its TypeScript types from the OpenAPI schema they produce.

- Every string the glass draws is `Annotated[str, Field(min_length=..., max_length=N), GLYPHS]`. `GLYPHS` rejects
  characters the stroke font lacks (`text.py` mirrors `ddi/generated/strokeFont.ts` plus `ddi/font/extraGlyphs.ts`).
  Strings only the semantic layer shows (headings, names, meanings) take any characters.
- Wrapped prose uses `AfterValidator(FitsRows(chars=..., rows=...))`, which mirrors `wrapText` in
  `ddi/font/wrap.ts`.
- Limits come from the frontend: the comments in `src/frontend/src/content/types.ts`, the content-fit tests in
  `src/frontend/src/ddi/**/*.test.tsx`, and the format geometry they measure. When the frontend changes a slot, change
  the limit here in the same pull request.
- `sections.py` lists the sections: `ContentSection`, one `SectionSpec` each (model and the site paths to
  revalidate) and the aggregate `SiteContent`.
- Changing a stored shape needs a data migration (see `db/CLAUDE.md`) and an updated seed in `seed/content.py`.
