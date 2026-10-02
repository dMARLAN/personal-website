"""Operator commands: `uv run python src/cli.py --help` from src/api, or `uv run python cli.py --help` in the image."""

import sqlite3
import tempfile
from contextlib import closing
from datetime import UTC, datetime
from pathlib import Path

import click
from argon2 import PasswordHasher

from config._storage import StorageConfig
from db.migrate import new_revision, upgrade
from seed.content import seed_site_content


@click.group()
def cli() -> None:
    pass


@cli.command()
def migrate() -> None:
    """Apply every pending migration to the database in STORAGE_DATA_DIR. The API also does this at startup."""
    upgrade(StorageConfig().db_path)  # pyright: ignore[reportCallIssue]  # fields come from STORAGE_* env vars
    click.echo("Database is at the latest migration.")


@cli.command()
@click.argument("out_dir", type=click.Path(file_okay=False, path_type=Path))
def backup(out_dir: Path) -> None:
    """Copy the database (online, consistent) and the resume PDF into OUT_DIR, stamped with the UTC time.

    Uses SQLite's online backup API, the same one as the sqlite3 shell's `.backup`, so it is safe while the API runs.
    """
    storage = StorageConfig()  # pyright: ignore[reportCallIssue]  # fields come from STORAGE_* env vars
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    db_copy = out_dir / f"site-{stamp}.db"
    with closing(sqlite3.connect(storage.db_path)) as source, closing(sqlite3.connect(db_copy)) as target:
        source.backup(target)
    click.echo(f"Database -> {db_copy}")
    if storage.resume_path.exists():
        pdf_copy = out_dir / f"resume-{stamp}.pdf"
        pdf_copy.write_bytes(storage.resume_path.read_bytes())
        click.echo(f"Resume PDF -> {pdf_copy}")


@cli.command("hash-password")
def hash_password() -> None:
    """Prompt for the admin password and print its argon2 hash, for ADMIN_AUTH_PASSWORD_HASH."""
    # Prompts go to stderr, so `$(make -s hash-password)` captures only the hash.
    password = click.prompt("Admin password", hide_input=True, confirmation_prompt=True, err=True)
    click.echo(PasswordHasher().hash(password))


@cli.command("content-snapshot")
@click.argument("out_file", type=click.Path(dir_okay=False, path_type=Path))
def content_snapshot(out_file: Path) -> None:
    """Write the seed content as `GET /api/content` returns it: the frontend's fallback snapshot."""
    out_file.write_text(seed_site_content().model_dump_json(indent=2) + "\n", encoding="utf-8")
    click.echo(f"Seed content -> {out_file}")


@cli.command()
@click.argument("message")
def revision(message: str) -> None:
    """Autogenerate the next migration from db/models.py against a throwaway database at head."""
    with tempfile.TemporaryDirectory() as directory:
        db_path = Path(directory) / "head.db"
        upgrade(db_path)
        new_revision(db_path, message)


if __name__ == "__main__":
    cli()
