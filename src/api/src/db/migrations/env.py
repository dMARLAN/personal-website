from alembic import context
from sqlalchemy import create_engine, pool

from db.database import listen_for_pragmas
from db.models import Base


def run_migrations() -> None:
    url = context.config.get_main_option("sqlalchemy.url")
    if url is None:
        raise RuntimeError("sqlalchemy.url is not set; run migrations through db.migrate")
    engine = create_engine(url, poolclass=pool.NullPool)
    listen_for_pragmas(engine)
    with engine.connect() as connection:
        # render_as_batch: SQLite cannot ALTER most constraints, so Alembic rebuilds the table instead.
        context.configure(connection=connection, target_metadata=Base.metadata, render_as_batch=True)
        with context.begin_transaction():
            context.run_migrations()


run_migrations()
