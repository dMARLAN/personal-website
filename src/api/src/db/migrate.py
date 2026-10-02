from pathlib import Path
from typing import Final

from alembic import command
from alembic.config import Config as AlembicConfig
from alembic.script import ScriptDirectory

_SCRIPT_LOCATION: Final[Path] = Path(__file__).parent / "migrations"


def alembic_config(db_path: Path) -> AlembicConfig:
    """Alembic needs no alembic.ini here: every entry point (startup, the CLI, tests) passes the database path."""
    config = AlembicConfig()
    config.set_main_option("script_location", str(_SCRIPT_LOCATION))
    config.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")
    return config


def upgrade(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    command.upgrade(alembic_config(db_path), "head")


def new_revision(db_path: Path, message: str) -> None:
    """Autogenerate the next numbered revision (`0002_<slug>.py`, ...) against `db_path`, which must be at head."""
    config = alembic_config(db_path)
    config.set_main_option("file_template", "%%(rev)s_%%(slug)s")
    head = ScriptDirectory.from_config(config).get_current_head()
    rev_id = "0001" if head is None else f"{int(head) + 1:04d}"
    command.revision(config, message=message, autogenerate=True, rev_id=rev_id)
