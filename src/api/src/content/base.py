from collections.abc import Sequence

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

type Loc = tuple[str | int, ...]


class ContentModel(BaseModel):
    """Base for every content schema: camelCase on the wire (as the frontend's types are), unknown keys rejected."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        serialize_by_alias=True,
        extra="forbid",
        frozen=True,
    )


class ContentRuleError(ValueError):
    """A cross-field rule failed in a model validator.

    Pydantic locates a model validator's error at the model. `loc` is the offending field's camelCase path from that
    model, which the 422 handler (`routes/errors.py`) appends, so the admin form can mark the field itself.
    """

    def __init__(self, loc: Loc, message: str) -> None:
        super().__init__(message)
        self.loc = loc


def first_duplicate[T](values: Sequence[T]) -> int | None:
    """The index of the first value that repeats an earlier one, or None when all are distinct."""
    seen: set[T] = set()
    for index, value in enumerate(values):
        if value in seen:
            return index
        seen.add(value)
    return None
