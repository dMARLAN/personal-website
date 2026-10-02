from datetime import UTC, datetime

from db.database import DatabaseContext
from repo.content import ContentRepository

NOW = datetime(2026, 10, 2, 12, 0, tzinfo=UTC)


async def test_insert_missing_inserts_once(db_ctx: DatabaseContext) -> None:
    # Arrange
    repo = ContentRepository(db_ctx)

    # Act
    first = await repo.insert_missing(section="profile", document='{"a": 1}', etag="e1", updated_at=NOW)
    second = await repo.insert_missing(section="profile", document='{"a": 2}', etag="e2", updated_at=NOW)

    # Assert
    assert (first, second) == (True, False)
    stored = await repo.get("profile")
    assert stored is not None
    assert (stored.document, stored.etag, stored.updated_at) == ('{"a": 1}', "e1", NOW)


async def test_get_returns_none_for_an_unknown_section(db_ctx: DatabaseContext) -> None:
    assert await ContentRepository(db_ctx).get("nope") is None


async def test_get_all_returns_every_section(db_ctx: DatabaseContext) -> None:
    repo = ContentRepository(db_ctx)
    await repo.insert_missing(section="work", document="{}", etag="w", updated_at=NOW)
    await repo.insert_missing(section="links", document="{}", etag="l", updated_at=NOW)

    rows = await repo.get_all()

    assert [row.section for row in rows] == ["links", "work"]


async def test_update_replaces_the_document(db_ctx: DatabaseContext) -> None:
    # Arrange
    repo = ContentRepository(db_ctx)
    await repo.insert_missing(section="profile", document="{}", etag="old", updated_at=NOW)
    later = datetime(2026, 10, 3, tzinfo=UTC)

    # Act
    updated = await repo.update(section="profile", document='{"b": 2}', etag="new", updated_at=later, if_etag=None)

    # Assert
    assert updated is not None
    assert (updated.document, updated.etag, updated.updated_at) == ('{"b": 2}', "new", later)


async def test_update_with_a_stale_etag_changes_nothing(db_ctx: DatabaseContext) -> None:
    # Arrange
    repo = ContentRepository(db_ctx)
    await repo.insert_missing(section="profile", document="{}", etag="current", updated_at=NOW)

    # Act
    updated = await repo.update(section="profile", document='{"b": 2}', etag="new", updated_at=NOW, if_etag="stale")

    # Assert
    assert updated is None
    stored = await repo.get("profile")
    assert stored is not None
    assert stored.etag == "current"


async def test_update_with_the_current_etag_saves(db_ctx: DatabaseContext) -> None:
    repo = ContentRepository(db_ctx)
    await repo.insert_missing(section="profile", document="{}", etag="current", updated_at=NOW)

    updated = await repo.update(section="profile", document="[]", etag="new", updated_at=NOW, if_etag="current")

    assert updated is not None
    assert updated.etag == "new"
