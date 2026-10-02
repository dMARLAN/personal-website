from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path
from sqlite3 import Connection
from typing import Final

from sqlalchemy import Engine, event
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import ConnectionPoolEntry

# WAL lets the public reads run while an admin write commits. busy_timeout makes a writer wait for the lock instead
# of failing at once. NORMAL is durable under WAL except across a power cut, which can lose the last commit only.
_PRAGMAS: Final[tuple[str, ...]] = (
    "PRAGMA journal_mode=WAL",
    "PRAGMA busy_timeout=5000",
    "PRAGMA synchronous=NORMAL",
    "PRAGMA foreign_keys=ON",
)


def apply_pragmas(dbapi_connection: Connection, _: ConnectionPoolEntry) -> None:
    cursor = dbapi_connection.cursor()
    for pragma in _PRAGMAS:
        cursor.execute(pragma)
    cursor.close()


def listen_for_pragmas(engine: Engine) -> None:
    event.listen(engine, "connect", apply_pragmas)


class DatabaseContext:
    """The async engine for the SQLite file. One per process: the container holds it as a singleton."""

    def __init__(self, db_path: Path) -> None:
        self.engine: AsyncEngine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")
        listen_for_pragmas(self.engine.sync_engine)
        self.session_maker = async_sessionmaker(bind=self.engine, autoflush=False, expire_on_commit=False)

    async def dispose(self) -> None:
        await self.engine.dispose()


@asynccontextmanager
async def get_db(db_ctx: DatabaseContext) -> AsyncGenerator[AsyncSession]:
    # Closing the session rolls back whatever the caller did not commit.
    async with db_ctx.session_maker() as session:
        yield session
