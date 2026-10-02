# Repositories

Repositories own all SQL. They query with raw SQL via `sqlalchemy.text()`, not ORM queries.

```python
class ContentRepository(Repository):
    async def get(self, section: str) -> StoredSection | None:
        async with self.transaction() as session:
            result = await session.execute(text("SELECT ... WHERE section = :section"), {"section": section})
            if row := result.one_or_none():
                return StoredSection.model_validate(row, from_attributes=True)
            return None
```

- Extend `Repository`; each method opens `self.transaction()`, which commits when the block ends and rolls back if it
  raises. Never call `session.commit()` yourself.
- Row types live in `repo/types.py`. Timestamps are stored as UTC ISO text through `to_db_time`, so they compare as
  text in SQL.
- Prefer `RETURNING` to tell what a write did (inserted, matched an ETag) instead of `rowcount`.
- SQLite-specific behaviour (pragmas, `ON CONFLICT`, `json_valid`) stays here and in `db/`, never in services.
