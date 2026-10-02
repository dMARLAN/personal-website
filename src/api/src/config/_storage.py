from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class StorageConfig(BaseSettings):
    """The persistent volume: the SQLite database and the uploaded resume PDF live side by side in `data_dir`."""

    model_config = SettingsConfigDict(env_prefix="STORAGE_")

    data_dir: Path

    @property
    def db_path(self) -> Path:
        return self.data_dir / "site.db"

    @property
    def resume_path(self) -> Path:
        return self.data_dir / "resume.pdf"
