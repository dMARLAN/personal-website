import logging

from pydantic_settings import BaseSettings, SettingsConfigDict


class LoggerSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="LOG_")

    level: int = logging.INFO
