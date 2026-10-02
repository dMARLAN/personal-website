"""Each section rejects content the DDI cannot draw. Every case starts from the seed and breaks one limit."""

import copy
from collections.abc import Callable
from typing import Any

import pytest
from pydantic import ValidationError

from content.sections import ContentSection, SiteContent
from seed.content import SEED_DOCUMENTS

type Document = dict[str, Any]
type Mutation = Callable[[Document], None]


def seed_document(section: ContentSection) -> Document:
    return copy.deepcopy(SEED_DOCUMENTS[section].model_dump(mode="json"))


def validate(section: ContentSection, document: Document) -> None:
    type(SEED_DOCUMENTS[section]).model_validate(document)


def test_the_seed_is_valid_site_content() -> None:
    SiteContent.model_validate({section.value: seed_document(section) for section in ContentSection})


def _set(path: str, value: object) -> Mutation:
    """A mutation that sets the value at a dotted path such as `status.0.value`."""

    def mutate(document: Document) -> None:
        *parents, last = path.split(".")
        target: Any = document
        for key in parents:
            target = target[int(key)] if isinstance(target, list) else target[key]
        if isinstance(target, list):
            target[int(last)] = value
        else:
            target[last] = value

    return mutate


def _append(path: str, value: object) -> Mutation:
    def mutate(document: Document) -> None:
        target: Any = document
        for key in path.split("."):
            target = target[int(key)] if isinstance(target, list) else target[key]
        target.append(value)

    return mutate


LONG_WORDS = " ".join(["placeholder"] * 30)
# Within the slot's character budget, but each word takes a row of its own, so it wraps to 10 rows.
TEN_ROWS_OF_18 = " ".join(["placeholder"] * 10)
EIGHT_ROWS_OF_47 = " ".join(["x" * 24] * 8)

CASES: list[tuple[ContentSection, Mutation, str]] = [
    # About: TGT DATA OWNSHIP.
    (ContentSection.PROFILE, _set("badge", "X" * 19), "at most 18"),
    (ContentSection.PROFILE, _set("status.0.label", "ROLE:XYZ"), "at most 7"),
    (ContentSection.PROFILE, _set("status.0.value", "X" * 10), "at most 9"),
    (ContentSection.PROFILE, _set("loadout.0", "X" * 18), "at most 17"),
    (ContentSection.PROFILE, _set("tags.0.value", "X" * 15), "fits 18"),
    (ContentSection.PROFILE, _set("bio", TEN_ROWS_OF_18), "the slot fits 9 rows of 18"),
    (ContentSection.PROFILE, _set("bio", LONG_WORDS), "at most 170"),
    (ContentSection.PROFILE, _set("footer", "COFFEE!"), "no glyph"),
    (ContentSection.PROFILE, _append("loadout", "6 - EXTRA"), "at most 5"),
    (ContentSection.PROFILE, _set("header", "NAME"), "Extra inputs"),
    # Resume: S/W CONFIGURATION.
    (ContentSection.RESUME, _set("title.0", "X" * 25), "at most 24"),
    (ContentSection.RESUME, _set("left.rows.0.name", "Pythons"), "at most 6"),
    (ContentSection.RESUME, _set("left.rows.0.value", "X" * 16), "at most 15"),
    (ContentSection.RESUME, _set("right.rows.0.value", "X" * 13), "at most 12"),
    (ContentSection.RESUME, _append("left.rows", {"name": "More", "value": "Rows"}), "at most 12"),
    # Work history.
    (ContentSection.WORK, _set("employers.0.tab", "NORTHWND"), "at most 7"),
    (ContentSection.WORK, _set("employers.0.roles.0.title", "X" * 28), "at most 27"),
    (ContentSection.WORK, _set("employers.0.roles.0.span", "2023-2026X"), "at most 9"),
    (ContentSection.WORK, _set("employers.0.location", "X" * 31), "the subline fits 38"),
    (ContentSection.WORK, _set("employers.0.roles.0.bullets", [LONG_WORDS, LONG_WORDS]), "fits 16 rows of 38"),
    (ContentSection.WORK, _set("employers.1.id", "northwind"), "unique"),
    (ContentSection.WORK, _set("employers.0.roles", []), "at least 1"),
    # Projects: STORES.
    (ContentSection.PROJECTS, _set("projects.0.station", 8), "own station"),
    (ContentSection.PROJECTS, _set("projects.0.station", 1), "cannot carry a pair"),
    (ContentSection.PROJECTS, _set("projects.0.code", "WEBSITE"), "at most 6"),
    (ContentSection.PROJECTS, _set("projects.0.name", "X" * 23), "at most 22"),
    (ContentSection.PROJECTS, _set("projects.0.category", "GAMES"), "do not exist"),
    (ContentSection.PROJECTS, _set("projects.0.description", EIGHT_ROWS_OF_47), "7 rows of 47"),
    (ContentSection.PROJECTS, _set("projects.0.fields.left.0.value", "X" * 8), "at most 7"),
    (ContentSection.PROJECTS, _set("projects.0.fields.right.0.value", "X" * 16), "at most 15"),
    (ContentSection.PROJECTS, _set("projects.0.links.1.kind", "REPO"), "one link of each kind"),
    (ContentSection.PROJECTS, _set("projects.0.links.0.url", "http://insecure.example"), "pattern"),
    (ContentSection.PROJECTS, _set("projects.6.store.amount", 100), "less than or equal to 99"),
    (ContentSection.PROJECTS, _append("categories", {"legend": "EMPTY", "name": "Empty"}), "without projects"),
    # Contact: MIDS.
    (ContentSection.CONTACT, _set("rows.0.value", "X" * 40), "a row fits 46"),
    (ContentSection.CONTACT, _set("email", "not-an-email"), "pattern"),
    (ContentSection.CONTACT, _set("email", f"{'x' * 30}@example.com"), "at most 40"),
    # Links: UFC BU.
    (ContentSection.LINKS, _set("links.0.name", "GitHubbbb"), "at most 8"),
    (ContentSection.LINKS, _set("links.0.tag", "SOURCE!"), "at most 6"),
    (ContentSection.LINKS, _set("links.0.url", "javascript:alert(1)"), "pattern"),
    (ContentSection.LINKS, _set("links", []), "at least 1"),
    # Showcase pages.
    (ContentSection.SERVER, _set("hosts.0.header", "LEFT NASXX"), "at most 9"),
    (ContentSection.SERVER, _set("rows.0.label", "INLET TEMPS"), "at most 10"),
    (ContentSection.SERVER, _set("baseline.hosts.0.fan", 1234567), "value slot"),
    (ContentSection.SERVER, _set("rows.0.metric", "cpu"), "one per metric"),
    (ContentSection.FUEL, _set("tanks.4.label", "X" * 10), "fits 9"),
    (ContentSection.FUEL, _set("tanks.0.capacity", 10000), "less than or equal to 9999"),
    (ContentSection.FUEL, _set("tanks.1.id", "tk1"), "each of the nine tanks once"),
    (ContentSection.FCS, _set("failures.0", {"table": "left", "row": 0, "channel": 2}), "no cell at row 0"),
    (ContentSection.FCS, _set("statusRows.0.label", "X" * 6), "at most 5"),
    (ContentSection.FCS, _set("gLimit", "7.55"), "at most 3"),
    (ContentSection.CHECKLIST, _set("left.items.0", "X" * 14), "at most 13"),
    (ContentSection.CHECKLIST, _append("right.items", "TEN"), "at most 9"),
    (ContentSection.BIT, _set("checks.MC1.name", "X" * 10), "at most 9"),
    (ContentSection.BIT, _set("checks.RDR.name", "LOGGING8"), "item legend"),
    (ContentSection.BIT, _set("checks.MC1.status", "NO TEST"), "fuel-low"),
    (ContentSection.BIT, _set("checks.MC1.status", "IN TEST"), "Input should be"),
    (ContentSection.BIT, _set("swConfig.left.3", {"name": "ATARS", "value": "1"}), "stays blank"),
    (ContentSection.RADAR, _set("contacts.0.azimuth", 71), "less than or equal to 70"),
    (ContentSection.RADAR, _set("contacts", []), "at least 3"),
    (ContentSection.RADAR, _set("weapon", "AIM-120C"), "at most 6"),
    (ContentSection.MUMI, _set("muId.value", "X" * 16), "at most 15"),
    (ContentSection.MUMI, _set("idFields.0.value", "X" * 11), "at most 10"),
    (ContentSection.MUMI, _set("sms.value", "CDB~42"), "no glyph"),
    (ContentSection.MUMI, _set("errors.value", "X" * 16), "at most 15"),
]


@pytest.mark.parametrize(("section", "mutation", "message"), CASES)
def test_section_rejects_content_that_cannot_render(section: ContentSection, mutation: Mutation, message: str) -> None:
    # Arrange
    document = seed_document(section)
    mutation(document)

    # Act / Assert
    with pytest.raises(ValidationError, match=message):
        validate(section, document)


def test_bit_requires_every_item() -> None:
    document = seed_document(ContentSection.BIT)
    del document["checks"]["ASPJ"]

    with pytest.raises(ValidationError, match="at least 42 items"):
        validate(ContentSection.BIT, document)


def test_lower_case_text_is_accepted_because_the_glass_upper_cases_it() -> None:
    document = seed_document(ContentSection.LINKS)
    document["links"][0]["name"] = "github"

    validate(ContentSection.LINKS, document)
