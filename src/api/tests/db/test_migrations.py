import sqlite3
from contextlib import closing
from pathlib import Path

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine

from db.database import DatabaseContext
from db.migrate import alembic_config, upgrade
from db.models import Base

BUSY_TIMEOUT_MS = 5000


def _tables(db_path: Path) -> set[str]:
    with closing(sqlite3.connect(db_path)) as connection:
        rows = connection.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall()
    return {name for (name,) in rows}


def test_upgrade_creates_the_schema_on_an_empty_database(tmp_path: Path) -> None:
    # Arrange
    db_path = tmp_path / "nested" / "site.db"

    # Act
    upgrade(db_path)

    # Assert
    assert {"content_section", "admin_session", "alembic_version"} <= _tables(db_path)
    head = ScriptDirectory.from_config(alembic_config(db_path)).get_current_head()
    with closing(sqlite3.connect(db_path)) as connection:
        assert connection.execute("SELECT version_num FROM alembic_version").fetchall() == [(head,)]


def test_upgrade_twice_is_a_no_op(tmp_path: Path) -> None:
    db_path = tmp_path / "site.db"
    upgrade(db_path)

    upgrade(db_path)

    assert "content_section" in _tables(db_path)


def test_migrations_match_the_models(tmp_path: Path) -> None:
    # Arrange
    db_path = tmp_path / "site.db"
    upgrade(db_path)
    engine = create_engine(f"sqlite:///{db_path}")

    # Act
    with engine.connect() as connection:
        differences = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    engine.dispose()

    # Assert
    assert differences == []


def test_downgrade_to_base_removes_the_schema(tmp_path: Path) -> None:
    db_path = tmp_path / "site.db"
    upgrade(db_path)

    command.downgrade(alembic_config(db_path), "base")

    assert _tables(db_path) == {"alembic_version"}


async def test_connections_use_wal_and_a_busy_timeout(db_ctx: DatabaseContext) -> None:
    async with db_ctx.engine.connect() as connection:
        journal_mode = (await connection.exec_driver_sql("PRAGMA journal_mode")).scalar_one()
        busy_timeout = (await connection.exec_driver_sql("PRAGMA busy_timeout")).scalar_one()

    assert journal_mode == "wal"
    assert busy_timeout == BUSY_TIMEOUT_MS
