from datetime import datetime
from typing import Annotated

from pydantic import Field

from content.base import ContentModel


class LoginRequest(ContentModel):
    password: Annotated[str, Field(min_length=1, max_length=1024)]


class AdminSessionInfo(ContentModel):
    """Send `csrfToken` as the `X-CSRF-Token` header on every mutating admin request."""

    csrf_token: str
    expires_at: datetime
