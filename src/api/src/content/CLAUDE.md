# Content schemas

One module per site section, each a `ContentModel` (camelCase JSON, unknown keys rejected). They are the API's
source of truth: the frontend generates its TypeScript types from the OpenAPI schema they produce.

- The JSON Schema these models produce builds the admin forms (docs/design.md section 13.2). Every field has
  `Field(title=..., description=...)`, and every limit JSON Schema can express goes in `Field` (lengths, counts,
  bounds, patterns), not only in a validator. `tests/content/test_schema.py` walks the OpenAPI and fails otherwise.
- Every string the glass draws is `Annotated[str, Field(min_length=..., max_length=N, ...), GLYPHS]`. `GLYPHS`
  rejects characters the stroke font lacks (`text.py` mirrors `ddi/generated/strokeFont.ts` plus
  `ddi/font/extraGlyphs.ts`) and puts the font's `pattern` in the schema. Strings only the semantic layer shows
  (headings, names, meanings) take any characters.
- Wrapped prose uses a `FitsRows(chars=..., rows=...)` annotation, which mirrors `wrapText` in `ddi/font/wrap.ts`,
  with `Field(max_length=<it>.max_length)`.
- A rule JSON Schema cannot express keeps its validator and gets an `x-` key from `extensions.py`
  (`combined_length`, `unique_by`, `options_from`, `rules`, ...). A model validator raises `ContentRuleError` with
  the offending field's camelCase path, so the 422 points at the field. A variable-length list gets `new_item(...)`,
  built as its model so it is valid.
- Limits come from the frontend: the comments in `src/frontend/src/content/types.ts`, the content-fit tests in
  `src/frontend/src/ddi/**/*.test.tsx`, and the format geometry they measure. When the frontend changes a slot, change
  the limit here in the same pull request.
- `sections.py` lists the sections: `ContentSection`, one `SectionSpec` each (model and the site paths to
  revalidate) and the aggregate `SiteContent`.
- Changing a stored shape needs a data migration of published documents and drafts (see `db/CLAUDE.md`), an
  updated seed in `seed/content.py`, a regenerated frontend snapshot
  (`uv run python src/cli.py content-snapshot ../frontend/src/content/snapshot.json`) and regenerated frontend types
  (`npm run openapi:gen`).
