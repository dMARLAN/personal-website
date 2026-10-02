from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class RevalidateConfig(BaseSettings):
    """The Next.js on-demand revalidation endpoint the API calls after an admin write (docs/design.md section 13)."""

    model_config = SettingsConfigDict(env_prefix="REVALIDATE_")

    url: str
    secret: SecretStr
