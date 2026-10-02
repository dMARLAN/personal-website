"""Test doubles and helpers shared by the fixtures in conftest.py and the tests that annotate with them."""

from dataclasses import dataclass, field

import httpx2
from fastapi.testclient import TestClient


@dataclass
class RevalidationEndpoint:
    """A stub of the Next.js revalidation route: records each request and answers with `status_code`."""

    status_code: int = 200
    requests: list[httpx2.Request] = field(default_factory=list)

    def handle(self, request: httpx2.Request) -> httpx2.Response:
        self.requests.append(request)
        return httpx2.Response(self.status_code, json={"revalidated": True})


@dataclass(frozen=True, slots=True)
class AdminClient:
    """A test client signed in as the admin, with the session's CSRF token."""

    client: TestClient
    csrf_token: str

    @property
    def csrf_headers(self) -> dict[str, str]:
        return {"X-CSRF-Token": self.csrf_token}
