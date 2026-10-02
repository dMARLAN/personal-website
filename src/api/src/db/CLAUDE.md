# Database

SQLite at `$STORAGE_DATA_DIR/site.db`, one API replica.

- `database.py`: the async engine (`aiosqlite`). Every connection sets `journal_mode=WAL`, `busy_timeout=5000`,
  `synchronous=NORMAL` and `foreign_keys=ON`.
- `models.py`: SQLAlchemy table models. They exist for Alembic autogenerate; repos still use raw SQL.
- `migrations/`: Alembic, driven by `migrate.py` (no alembic.ini). The API runs `upgrade` at startup.
- New migration: change `models.py`, then `uv run python src/cli.py revision "add x"` from `src/api`. It
  autogenerates `000N_add_x.py` against a throwaway database at head. Review it; `render_as_batch` rebuilds tables
  where SQLite cannot `ALTER`.
- **Content schema changes** (a field added, renamed or re-limited in `content/`) need a data migration that rewrites
  the stored JSON in `content_section` and `content_draft`, because reads validate every stored document and draft
  and fail loudly on a mismatch. Do the transform in the migration with plain JSON, never by importing the current
  Pydantic models: they change after the migration is written.
- `tests/db/test_migrations.py` checks that migrations apply to an empty database and match `models.py`.
