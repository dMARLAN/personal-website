from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


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
