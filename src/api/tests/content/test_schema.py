"""The OpenAPI schema carries every limit the admin forms need: standard keywords where JSON Schema has one, the
`x-` keys of `content/extensions.py` where it has none (docs/design.md section 13.2)."""

from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any, Final, get_args, get_origin

import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel, JsonValue, TypeAdapter

from content.base import ContentModel
from content.extensions import (
    DDI_CHARSET,
    DDI_COMBINED_LENGTH,
    DDI_WRAP,
    UI_NEW_ITEM,
    UI_OPTIONS_FROM,
    UI_RULES,
    UI_UNIQUE_BY,
    UI_WIDGET,
)
from content.sections import ContentSection, SiteContent
from content.text import GLYPH_PATTERN
from main import app

type Schema = dict[str, Any]

_REF_PREFIX: Final[str] = "#/components/schemas/"


@pytest.fixture(scope="module")
def openapi() -> Schema:
    # The schema does not depend on the container's config, so the module-level app serves every test here.
    return TestClient(app).get("/openapi.json").json()


def _components(openapi: Schema) -> Schema:
    return openapi["components"]["schemas"]


def _resolve(openapi: Schema, schema: Schema) -> Schema:
    """A schema with its `$ref` inlined; keys beside the `$ref` (title, description, `x-`) win."""
    if "$ref" not in schema:
        return schema
    target = _components(openapi)[schema["$ref"].removeprefix(_REF_PREFIX)]
    return {**_resolve(openapi, target), **{key: value for key, value in schema.items() if key != "$ref"}}


@dataclass(frozen=True, slots=True)
class Node:
    path: str
    schema: Schema
    # Whether the node is an object property, which needs a title and description of its own.
    is_property: bool


def _walk(openapi: Schema, schema: Schema, path: str, *, is_property: bool = False) -> Iterator[Node]:
    resolved = _resolve(openapi, schema)
    yield Node(path, resolved, is_property)
    for name, child in resolved.get("properties", {}).items():
        yield from _walk(openapi, child, f"{path}.{name}", is_property=True)
    for index, child in enumerate(resolved.get("prefixItems", [])):
        yield from _walk(openapi, child, f"{path}[{index}]")
    for key in ("items", "additionalProperties"):
        if isinstance(child := resolved.get(key), dict):
            yield from _walk(openapi, child, f"{path}[*]")
    for key in ("anyOf", "oneOf"):
        for child in resolved.get(key, []):
            yield from _walk(openapi, child, path)


def _section_body(openapi: Schema, section: ContentSection) -> Schema:
    put = openapi["paths"][f"/api/admin/content/{section}"]["put"]
    return put["requestBody"]["content"]["application/json"]["schema"]


def _section_nodes(openapi: Schema, section: ContentSection) -> list[Node]:
    return list(_walk(openapi, _section_body(openapi, section), section.value))


def _node(openapi: Schema, section: ContentSection, path: str) -> Schema:
    [match] = [node.schema for node in _section_nodes(openapi, section) if node.path == f"{section}.{path}"]
    return match


@pytest.mark.parametrize("section", list(ContentSection))
def test_every_property_has_a_title_and_a_description(openapi: Schema, section: ContentSection) -> None:
    missing = [
        node.path
        for node in _section_nodes(openapi, section)
        if node.is_property and not (node.schema.get("title") and node.schema.get("description"))
    ]

    assert missing == []


@pytest.mark.parametrize("section", list(ContentSection))
def test_every_drawn_string_has_a_max_length_and_the_font_pattern(openapi: Schema, section: ContentSection) -> None:
    drawn = [node for node in _section_nodes(openapi, section) if DDI_CHARSET in node.schema]

    assert drawn
    for node in drawn:
        patterns = [node.schema.get("pattern"), *(part.get("pattern") for part in node.schema.get("allOf", []))]
        assert "maxLength" in node.schema, node.path
        assert GLYPH_PATTERN in patterns, node.path


@pytest.mark.parametrize("section", list(ContentSection))
def test_every_variable_length_array_has_a_new_item(openapi: Schema, section: ContentSection) -> None:
    missing = [
        node.path
        for node in _section_nodes(openapi, section)
        if node.schema.get("type") == "array"
        and "prefixItems" not in node.schema
        and node.schema.get("minItems") != node.schema.get("maxItems")
        and UI_NEW_ITEM not in node.schema
    ]

    assert missing == []


def _models(model: type[BaseModel]) -> Iterator[type[BaseModel]]:
    """`model` and every content model its fields reach, nested in lists, tuples, dicts and unions included."""
    yield model
    for field in model.model_fields.values():
        for argument in [field.annotation, *get_args(field.annotation)]:
            for inner in [argument, *get_args(argument)]:
                if isinstance(inner, type) and issubclass(inner, ContentModel):
                    yield from _models(inner)


@dataclass(frozen=True, slots=True)
class NewItemCase:
    path: str
    item_adapter: TypeAdapter[object]
    item: JsonValue


def _new_item_cases() -> Iterator[NewItemCase]:
    for model in set(_models(SiteContent)):
        for name, field in model.model_fields.items():
            extra = field.json_schema_extra
            if get_origin(field.annotation) is list and isinstance(extra, dict) and UI_NEW_ITEM in extra:
                [item_type] = get_args(field.annotation)
                yield NewItemCase(f"{model.__name__}.{name}", TypeAdapter(item_type), extra[UI_NEW_ITEM])


_NEW_ITEM_CASES: Final[list[NewItemCase]] = sorted(_new_item_cases(), key=lambda case: case.path)


@pytest.mark.parametrize("case", _NEW_ITEM_CASES, ids=[case.path for case in _NEW_ITEM_CASES])
def test_every_new_item_is_a_valid_item(case: NewItemCase) -> None:
    case.item_adapter.validate_python(case.item)


def test_every_section_model_field_sets_its_title_and_description_explicitly() -> None:
    # Pydantic generates a title from the field name when none is given, so the OpenAPI walk alone cannot tell.
    missing = sorted(
        f"{model.__name__}.{name}"
        for section in SiteContent.model_fields.values()
        for model in _models(section.annotation)  # pyright: ignore[reportArgumentType]  # every section is a model
        for name, field in model.model_fields.items()
        if field.title is None or field.description is None
    )

    assert missing == []


@pytest.mark.parametrize(
    ("section", "path", "key", "value"),
    [
        (ContentSection.PROFILE, "bio", DDI_WRAP, {"chars": 18, "rows": 9}),
        (ContentSection.PROFILE, "bio", "maxLength", 170),
        (
            ContentSection.PROFILE,
            "tags[0]",
            DDI_COMBINED_LENGTH,
            {"fields": ["label", "value"], "gap": 1, "maxLength": 18},
        ),
        (ContentSection.PROFILE, "badge", "maxLength", 18),
        (ContentSection.RESUME, "left.rows", "maxItems", 12),
        (ContentSection.RESUME, "title[0]", "maxLength", 24),
        (ContentSection.WORK, "employers", UI_UNIQUE_BY, ["id"]),
        (ContentSection.WORK, "employers", "maxItems", 5),
        (ContentSection.WORK, "employers[*].id", "pattern", r"^[a-z0-9]+(?:-[a-z0-9]+)*$"),
        (ContentSection.WORK, "employers[*].roles[*].bullets[*]", DDI_WRAP, {"chars": 38, "rows": 17}),
        (ContentSection.PROJECTS, "projects", UI_UNIQUE_BY, ["slug", "station"]),
        (ContentSection.PROJECTS, "projects[*].station", "maximum", 9),
        (ContentSection.PROJECTS, "projects[*].category", UI_OPTIONS_FROM, "categories/*/legend"),
        (ContentSection.PROJECTS, "projects[*].status", "enum", ["RDY", "STBY", "DEGD", "HUNG"]),
        (ContentSection.PROJECTS, "projects[*].links[*].url", UI_WIDGET, "url"),
        (ContentSection.CONTACT, "email", UI_WIDGET, "email"),
        (
            ContentSection.CONTACT,
            "rows[0]",
            DDI_COMBINED_LENGTH,
            {"fields": ["label", "value"], "gap": 0, "maxLength": 46},
        ),
        (ContentSection.LINKS, "links", "maxItems", 10),
        (ContentSection.LINKS, "links[*].url", "pattern", r"^(https://|/)\S*$"),
        (ContentSection.SERVER, "rows", "minItems", 13),
        (ContentSection.SERVER, "rows[*].suffix", "maxLength", 5),
        (ContentSection.FUEL, "tanks", UI_UNIQUE_BY, ["id"]),
        (ContentSection.FUEL, "tanks[*].capacity", "maximum", 9999),
        (ContentSection.FCS, "failures[*].channel", "maximum", 4),
        (ContentSection.FCS, "statusRows", "maxItems", 11),
        (ContentSection.CHECKLIST, "left.items", "maxItems", 6),
        (ContentSection.CHECKLIST, "right.items[*]", "maxLength", 16),
        (ContentSection.BIT, "checks", "minProperties", 42),
        (ContentSection.BIT, "checks", "maxProperties", 42),
        (ContentSection.BIT, "legendNames[*]", "maxLength", 7),
        (ContentSection.RADAR, "contacts", "minItems", 3),
        (ContentSection.RADAR, "contacts[*].azimuth", "minimum", -70),
        (ContentSection.MUMI, "muId.value", "maxLength", 15),
        (ContentSection.MUMI, "loadedMuId", DDI_CHARSET, "stroke-font"),
    ],
)
def test_section_schema_carries_its_limit(
    openapi: Schema, section: ContentSection, path: str, key: str, value: object
) -> None:
    assert _node(openapi, section, path)[key] == value


@pytest.mark.parametrize(
    ("section", "path"),
    [
        (ContentSection.WORK, "employers[*]"),
        (ContentSection.PROJECTS, "projects[*]"),
        (ContentSection.SERVER, "rows"),
        (ContentSection.FUEL, "tanks[*]"),
        (ContentSection.FCS, "failures[*]"),
        (ContentSection.BIT, "checks"),
        (ContentSection.BIT, "swConfig.left"),
    ],
)
def test_rules_json_schema_cannot_express_are_described(openapi: Schema, section: ContentSection, path: str) -> None:
    assert _node(openapi, section, path)[UI_RULES]


@pytest.mark.parametrize("section", list(ContentSection))
def test_each_section_has_named_request_and_response_components(openapi: Schema, section: ContentSection) -> None:
    # Arrange
    model = SiteContent.model_fields[section.value].annotation.__name__  # pyright: ignore[reportOptionalMemberAccess]
    content = openapi["paths"][f"/api/admin/content/{section}"]

    def response_ref(operation: Schema) -> str:
        return operation["responses"]["200"]["content"]["application/json"]["schema"]["$ref"]

    # Assert
    assert _section_body(openapi, section)["$ref"] == f"{_REF_PREFIX}{model}"
    assert response_ref(content["get"]) == f"{_REF_PREFIX}SectionState_{model}_"
    assert response_ref(content["put"]) == f"{_REF_PREFIX}SavedSection_{model}_"
