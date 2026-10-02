from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AdminAuthConfig(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="ADMIN_AUTH_")

    # An argon2 hash (`make -C src/api hash-password`). Unset or empty means admin login is disabled: login answers 503.
    password_hash: SecretStr | None = None

    @field_validator("password_hash", mode="before")
    @classmethod
    def empty_is_unset(cls, value: str | SecretStr | None) -> str | SecretStr | None:
        # The Secret template and Tilt write an empty value when there is no hash (k8s/api/secret.example.yaml).
        return None if value == "" else value
