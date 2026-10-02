from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession

from db.database import DatabaseContext, get_db


class Repository:
    def __init__(self, db_ctx: DatabaseContext) -> None:
        self.__db_ctx = db_ctx

    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[AsyncSession]:
        """A session whose work commits when the block completes, and rolls back if it raises."""
        async with get_db(self.__db_ctx) as session:
            yield session
            await session.commit()
