from enum import StrEnum, auto


class RevalidationStatus(StrEnum):
    """Whether Next.js accepted the revalidation call after a write. The write itself is saved either way."""

    DONE = auto()
    FAILED = auto()
