from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class AdminAuthConfig(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ADMIN_AUTH_")

    # An argon2 hash (`make -C src/api hash-password`). Unset means admin login is disabled: login answers 503.
    password_hash: SecretStr | None = None
