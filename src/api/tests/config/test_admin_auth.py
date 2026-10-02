import pytest

from config._admin_auth import AdminAuthConfig


def test_an_empty_hash_disables_login(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ADMIN_AUTH_PASSWORD_HASH", "")

    assert AdminAuthConfig().password_hash is None


def test_a_hash_is_kept(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ADMIN_AUTH_PASSWORD_HASH", "$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$aGFzaA")

    hash_value = AdminAuthConfig().password_hash

    assert hash_value is not None
    assert hash_value.get_secret_value() == "$argon2id$v=19$m=65536,t=3,p=4$c2FsdA$aGFzaA"
