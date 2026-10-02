from collections.abc import Sequence

import httpx2

from config import Config
from proj_logging.logger import get_logger
from services.revalidation.types import RevalidationStatus

log = get_logger(__name__)


class RevalidationService:
    """Asks the Next.js frontend to re-render site paths after an admin write.

    Contract (docs/design.md section 13): `POST <REVALIDATE_URL>` with `Authorization: Bearer <REVALIDATE_SECRET>` and
    the JSON body `{"paths": ["/about", ...]}`. Any 2xx response means the paths were revalidated.
    """

    def __init__(self, client: httpx2.AsyncClient, config: Config) -> None:
        self.__client = client
        self.__url = config.revalidate.url
        self.__secret = config.revalidate.secret

    async def revalidate(self, paths: Sequence[str]) -> RevalidationStatus:
        try:
            response = await self.__client.post(
                self.__url,
                json={"paths": list(paths)},
                headers={"Authorization": f"Bearer {self.__secret.get_secret_value()}"},
            )
        except httpx2.HTTPError as error:
            # The write is already committed; report the failure to the admin instead of failing the save.
            log.warning(f"Revalidating {list(paths)} failed: {error!r}")
            return RevalidationStatus.FAILED
        if not response.is_success:
            log.warning(f"Revalidating {list(paths)} failed: HTTP {response.status_code}")
            return RevalidationStatus.FAILED
        return RevalidationStatus.DONE
