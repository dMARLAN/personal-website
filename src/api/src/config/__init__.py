from pydantic import Field
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource

from config._app import AppConfig


class Config(BaseSettings):
    app: AppConfig = Field(default_factory=AppConfig)

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
