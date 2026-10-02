import httpx2
from argon2 import PasswordHasher
from dependency_injector import containers, providers

from config import Config
from db.database import DatabaseContext
from repo.admin_session import AdminSessionRepository
from repo.content import ContentRepository
from services.auth.service import AuthService
from services.auth.throttle import LoginThrottle
from services.content.service import ContentService
from services.resume.service import ResumeService
from services.revalidation.service import RevalidationService


def _db_context(config: Config) -> DatabaseContext:
    return DatabaseContext(config.storage.db_path)


class Container(containers.DeclarativeContainer):
    wiring_config = containers.WiringConfiguration(
        modules=[
            "auth.admin",
            "routes.health",
            "routes.content.route",
            "routes.resume.route",
            "routes.admin.auth.route",
            "routes.admin.content.route",
            "routes.admin.resume.route",
        ]
    )

    config: providers.Singleton[Config] = providers.Singleton(Config)

    db_context: providers.Singleton[DatabaseContext] = providers.Singleton(_db_context, config=config)
    # Shared so revalidation calls reuse connections; closed in the app's lifespan.
    http_client: providers.Singleton[httpx2.AsyncClient] = providers.Singleton(httpx2.AsyncClient, timeout=5.0)
    # Singleton: the failure counts must outlive a request.
    login_throttle: providers.Singleton[LoginThrottle] = providers.Singleton(LoginThrottle)
    password_hasher: providers.Singleton[PasswordHasher] = providers.Singleton(PasswordHasher)

    content_repo: providers.Factory[ContentRepository] = providers.Factory(ContentRepository, db_ctx=db_context)
    admin_session_repo: providers.Factory[AdminSessionRepository] = providers.Factory(
        AdminSessionRepository, db_ctx=db_context
    )

    revalidation_service: providers.Factory[RevalidationService] = providers.Factory(
        RevalidationService, client=http_client, config=config
    )
    content_service: providers.Factory[ContentService] = providers.Factory(
        ContentService, content_repo=content_repo, revalidation_service=revalidation_service
    )
    resume_service: providers.Factory[ResumeService] = providers.Factory(
        ResumeService, config=config, revalidation_service=revalidation_service
    )
    auth_service: providers.Factory[AuthService] = providers.Factory(
        AuthService,
        session_repo=admin_session_repo,
        throttle=login_throttle,
        hasher=password_hasher,
        config=config,
    )
