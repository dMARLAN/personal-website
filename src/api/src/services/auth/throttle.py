import math
import time
from collections import deque
from collections.abc import Callable
from typing import Final

# Five wrong passwords from one client lock it out for the rest of a 15-minute sliding window.
_MAX_FAILURES: Final[int] = 5
_WINDOW_SECONDS: Final[float] = 15 * 60


class LoginThrottle:
    """Counts failed logins per client in process memory. The API runs one replica, so this is the whole picture."""

    def __init__(self, clock: Callable[[], float] = time.monotonic) -> None:
        self.__clock = clock
        self.__failures: dict[str, deque[float]] = {}

    def retry_after(self, client: str) -> int | None:
        """Seconds until `client` may try again, or None when it may try now."""
        failures = self.__recent_failures(client)
        if len(failures) < _MAX_FAILURES:
            return None
        return max(1, math.ceil(failures[0] + _WINDOW_SECONDS - self.__clock()))

    def record_failure(self, client: str) -> None:
        self.__recent_failures(client).append(self.__clock())

    def reset(self, client: str) -> None:
        self.__failures.pop(client, None)

    def __recent_failures(self, client: str) -> deque[float]:
        failures = self.__failures.setdefault(client, deque())
        cutoff = self.__clock() - _WINDOW_SECONDS
        while failures and failures[0] <= cutoff:
            failures.popleft()
        return failures
