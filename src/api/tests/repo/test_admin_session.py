from datetime import UTC, datetime, timedelta

from db.database import DatabaseContext
from repo.admin_session import AdminSessionRepository
from repo.types import AdminSessionRecord

NOW = datetime(2026, 10, 2, 12, 0, tzinfo=UTC)


def make_record(token_hash: str, expires_at: datetime) -> AdminSessionRecord:
    return AdminSessionRecord(token_hash=token_hash, csrf_token="csrf", created_at=NOW, expires_at=expires_at)


async def test_get_active_returns_an_unexpired_session(db_ctx: DatabaseContext) -> None:
    # Arrange
    repo = AdminSessionRepository(db_ctx)
    record = make_record("live", NOW + timedelta(hours=1))
    await repo.create(record)

    # Act
    found = await repo.get_active("live", NOW)

    # Assert
    assert found == record


async def test_get_active_ignores_an_expired_session(db_ctx: DatabaseContext) -> None:
    repo = AdminSessionRepository(db_ctx)
    await repo.create(make_record("old", NOW - timedelta(seconds=1)))

    assert await repo.get_active("old", NOW) is None


async def test_delete_removes_the_session(db_ctx: DatabaseContext) -> None:
    repo = AdminSessionRepository(db_ctx)
    await repo.create(make_record("gone", NOW + timedelta(hours=1)))

    await repo.delete("gone")

    assert await repo.get_active("gone", NOW) is None


async def test_delete_expired_keeps_live_sessions(db_ctx: DatabaseContext) -> None:
    # Arrange
    repo = AdminSessionRepository(db_ctx)
    await repo.create(make_record("old", NOW - timedelta(minutes=1)))
    await repo.create(make_record("live", NOW + timedelta(minutes=1)))

    # Act
    await repo.delete_expired(NOW)

    # Assert
    assert await repo.get_active("live", NOW) is not None
    assert await repo.get_active("old", NOW - timedelta(hours=1)) is None
