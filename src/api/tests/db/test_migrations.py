import hashlib
import json
import sqlite3
from contextlib import closing
from pathlib import Path

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine

from content.radar import RadarScene
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


def test_radar_contacts_gain_the_ownship_altitude(tmp_path: Path) -> None:
    # Arrange: a radar document stored before contacts had an altitude.
    db_path = tmp_path / "site.db"
    config = alembic_config(db_path)
    command.upgrade(config, "0001")
    old_scene = {
        "ownship": {"heading": 256, "airspeed": 404, "mach": "0.90", "altitude": 20480},
        "weapon": "9X 2",
        "contacts": [
            {"range": 33.0, "azimuth": -24.0, "speed": 880.0, "track": 172.0},
            {"range": 19.0, "azimuth": 31.0, "speed": 320.0, "track": 245.0},
            {"range": 52.0, "azimuth": 8.0, "speed": 720.0, "track": 186.0},
        ],
    }
    with closing(sqlite3.connect(db_path)) as connection, connection:
        connection.execute(
            "INSERT INTO content_section VALUES ('radar', ?, 'old-etag', '2026-10-02T00:00:00+00:00')",
            (json.dumps(old_scene),),
        )

    # Act
    command.upgrade(config, "head")

    # Assert
    with closing(sqlite3.connect(db_path)) as connection:
        document, etag = connection.execute(
            "SELECT document, etag FROM content_section WHERE section = 'radar'"
        ).fetchone()
    RadarScene.model_validate_json(document)
    assert [contact["altitude"] for contact in json.loads(document)["contacts"]] == [20480, 20480, 20480]
    assert etag == hashlib.sha256(document.encode()).hexdigest()
