from pydantic import Field
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource

from config._admin_auth import AdminAuthConfig
from config._app import AppConfig
from config._revalidate import RevalidateConfig
from config._storage import StorageConfig


class Config(BaseSettings):
    # The ignores: pyright reads required settings fields as required constructor arguments, but BaseSettings fills
    # them from the environment, and fails at startup if they are unset.
    app: AppConfig = Field(default_factory=AppConfig)
    storage: StorageConfig = Field(default_factory=StorageConfig)  # pyright: ignore[reportArgumentType]
    admin_auth: AdminAuthConfig = Field(default_factory=AdminAuthConfig)
    revalidate: RevalidateConfig = Field(default_factory=RevalidateConfig)  # pyright: ignore[reportArgumentType]

    @classmethod
    def settings_customise_sources(  # noqa: PLR0913, PLR0917
        cls,
        settings_cls: type[BaseSettings],  # noqa: ARG003
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,  # noqa: ARG003
        dotenv_settings: PydanticBaseSettingsSource,  # noqa: ARG003
        file_secret_settings: PydanticBaseSettingsSource,  # noqa: ARG003
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        # Each group sources its own prefixed variables (APP_, ...); the root must not also read the bare
        # group names from the environment.
        return (init_settings,)
