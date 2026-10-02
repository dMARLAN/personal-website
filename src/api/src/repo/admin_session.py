from datetime import datetime
from typing import Final

from sqlalchemy import text

from repo.base import Repository
from repo.types import AdminSessionRecord, to_db_time

_COLUMNS: Final[str] = "token_hash, csrf_token, created_at, expires_at"


class AdminSessionRepository(Repository):
    async def create(self, record: AdminSessionRecord) -> None:
        async with self.transaction() as session:
            await session.execute(
                text(f"""
                    INSERT INTO admin_session ({_COLUMNS})
                    VALUES (:token_hash, :csrf_token, :created_at, :expires_at)
                """),
                {
                    "token_hash": record.token_hash,
                    "csrf_token": record.csrf_token,
                    "created_at": to_db_time(record.created_at),
                    "expires_at": to_db_time(record.expires_at),
                },
            )

    async def get_active(self, token_hash: str, now: datetime) -> AdminSessionRecord | None:
        async with self.transaction() as session:
            result = await session.execute(
                text(f"SELECT {_COLUMNS} FROM admin_session WHERE token_hash = :token_hash AND expires_at > :now"),
                {"token_hash": token_hash, "now": to_db_time(now)},
            )
            if row := result.one_or_none():
                return AdminSessionRecord.model_validate(row, from_attributes=True)
            return None

    async def delete(self, token_hash: str) -> None:
        async with self.transaction() as session:
            await session.execute(
                text("DELETE FROM admin_session WHERE token_hash = :token_hash"), {"token_hash": token_hash}
            )

    async def delete_expired(self, now: datetime) -> None:
        async with self.transaction() as session:
            await session.execute(text("DELETE FROM admin_session WHERE expires_at <= :now"), {"now": to_db_time(now)})
