from enum import StrEnum, auto
from typing import Annotated, Final, Literal, Self

from pydantic import ConfigDict, Field, model_validator

from content.base import ContentModel, ContentRuleError, first_duplicate
from content.extensions import Widget, new_item, options_from, rules, unique_by, widget
from content.text import GLYPHS, FitsRows
from content.work import Slug


class ProjectStatus(StrEnum):
    """Words from the DCS `Status_Set` (STORES.lua line 9)."""

    RDY = "RDY"
    STBY = "STBY"
    DEGD = "DEGD"
    HUNG = "HUNG"


class StoreKind(StrEnum):
    MISSILE = auto()
    PAIR = auto()
    RACK = auto()
    TANK = auto()


_KIND_TITLE: Final[str] = "Kind"
_KIND_DESCRIPTION: Final[str] = "The store's symbol on the wingform."


class MissileStore(ContentModel):
    kind: Annotated[Literal[StoreKind.MISSILE], Field(title=_KIND_TITLE, description=_KIND_DESCRIPTION)]


class PairStore(ContentModel):
    kind: Annotated[Literal[StoreKind.PAIR], Field(title=_KIND_TITLE, description=_KIND_DESCRIPTION)]


class RackStore(ContentModel):
    kind: Annotated[Literal[StoreKind.RACK], Field(title=_KIND_TITLE, description=_KIND_DESCRIPTION)]
    amount: Annotated[
        int,
        Field(ge=1, le=99, title="Amount", description="The number of parts the project ships as; two digits at most."),
    ]


class TankStore(ContentModel):
    kind: Annotated[Literal[StoreKind.TANK], Field(title=_KIND_TITLE, description=_KIND_DESCRIPTION)]


type ProjectStore = Annotated[MissileStore | PairStore | RackStore | TankStore, Field(discriminator="kind")]

# `STATION_LOADS` in `ddi/formats/storesWingform.tsx`: what each station's Lua can draw.
_WING_LOADS: Final[frozenset[StoreKind]] = frozenset(StoreKind)
_STATION_LOADS: Final[dict[int, frozenset[StoreKind]]] = {
    1: frozenset({StoreKind.MISSILE}),
    2: _WING_LOADS,
    3: _WING_LOADS,
    4: frozenset({StoreKind.MISSILE}),
    5: frozenset({StoreKind.RACK, StoreKind.TANK}),
    6: frozenset({StoreKind.MISSILE}),
    7: _WING_LOADS,
    8: _WING_LOADS,
    9: frozenset({StoreKind.MISSILE}),
}
_STATION_RULE: Final[str] = (
    "Stations 1, 4, 6 and 9 carry only a missile; station 5 a rack or a tank; stations 2, 3, 7 and 8 any store."
)
_DESCRIPTION: Final[FitsRows] = FitsRows(chars=47, rows=7)
_MAX_FIELDS: Final[int] = 5


class ProjectCategory(ContentModel):
    legend: Annotated[
        str,
        Field(min_length=1, max_length=7, title="Legend", description="The top-row button legend; unique."),
        GLYPHS,
    ]
    name: Annotated[
        str, Field(min_length=1, title="Name", description="The category's name for screen readers; not drawn.")
    ]


class LeftField(ContentModel):
    """PROG block, left column: label and value each ≤ 7 (F100, 130 DI columns)."""

    label: Annotated[str, Field(min_length=1, max_length=7, title="Label", description="The field's name."), GLYPHS]
    value: Annotated[
        str, Field(min_length=1, max_length=7, title="Value", description="Drawn after the label."), GLYPHS
    ]


class RightField(ContentModel):
    """PROG block, right column: label ≤ 7, value ≤ 15."""

    label: Annotated[str, Field(min_length=1, max_length=7, title="Label", description="The field's name."), GLYPHS]
    value: Annotated[
        str, Field(min_length=1, max_length=15, title="Value", description="Drawn after the label."), GLYPHS
    ]


class ProjectFields(ContentModel):
    left: Annotated[
        list[LeftField],
        Field(
            max_length=_MAX_FIELDS,
            title="Left column",
            description=f"Up to {_MAX_FIELDS} rows; label and value ≤ 7 each.",
            json_schema_extra=new_item(LeftField(label="LABEL", value="VALUE")),
        ),
    ]
    right: Annotated[
        list[RightField],
        Field(
            max_length=_MAX_FIELDS,
            title="Right column",
            description=f"Up to {_MAX_FIELDS} rows; label ≤ 7, value ≤ 15.",
            json_schema_extra=new_item(RightField(label="LABEL", value="VALUE")),
        ),
    ]


class LinkKind(StrEnum):
    """The DATA sublevel legend: `REPO` at PB16, `DEMO` at PB19."""

    REPO = "REPO"
    DEMO = "DEMO"


class ProjectLink(ContentModel):
    kind: Annotated[LinkKind, Field(title="Kind", description="Which DATA legend opens it: REPO or DEMO.")]
    url: Annotated[
        str,
        Field(pattern=r"^https://\S+$", title="URL", description="An https URL.", json_schema_extra=widget(Widget.URL)),
    ]


class Project(ContentModel):
    model_config = ConfigDict(json_schema_extra=rules(_STATION_RULE))

    slug: Annotated[
        Slug, Field(title="Slug", description="The URL slug, lower case words joined by hyphens; unique per project.")
    ]
    station: Annotated[
        int, Field(ge=1, le=9, title="Station", description="The wingform station, 1 to 9; unique per project.")
    ]
    name: Annotated[
        str, Field(min_length=1, max_length=22, title="Name", description="Drawn above the PROG block."), GLYPHS
    ]
    code: Annotated[
        str,
        Field(min_length=1, max_length=6, title="Code", description="The station's type text on the wingform."),
        GLYPHS,
    ]
    store: Annotated[ProjectStore, Field(title="Store", description="The symbol the station draws.")]
    status: Annotated[ProjectStatus, Field(title="Status", description="The station's status word.")]
    category: Annotated[
        str,
        Field(
            title="Category",
            description="The legend of one of the categories above.",
            json_schema_extra=options_from("categories/*/legend"),
        ),
    ]
    fields: Annotated[ProjectFields, Field(title="PROG fields", description="The two columns of the PROG block.")]
    description: Annotated[
        str,
        Field(
            min_length=1,
            max_length=_DESCRIPTION.max_length,
            title="Description",
            description=(f"The DATA sublevel, wrapped to {_DESCRIPTION.rows} rows of {_DESCRIPTION.chars} characters."),
        ),
        GLYPHS,
        _DESCRIPTION,
    ]
    links: Annotated[
        list[ProjectLink],
        Field(
            max_length=len(LinkKind),
            title="Links",
            description="At most one REPO and one DEMO link.",
            json_schema_extra=unique_by("kind") | new_item(ProjectLink(kind=LinkKind.REPO, url="https://github.com/")),
        ),
    ]

    @model_validator(mode="after")
    def fits_station(self) -> Self:
        if self.store.kind not in _STATION_LOADS[self.station]:
            raise ContentRuleError(("store", "kind"), f"station {self.station} cannot carry a {self.store.kind} store")
        if (index := first_duplicate([link.kind for link in self.links])) is not None:
            raise ContentRuleError(("links", index, "kind"), "a project has at most one link of each kind")
        return self


class Projects(ContentModel):
    """Projects → STORES (docs/pages/projects.md): one category per top-row OSB (PB6–10), one project per station."""

    categories: Annotated[
        list[ProjectCategory],
        Field(
            min_length=1,
            max_length=5,
            title="Categories",
            description="1 to 5 categories, one per top-row button; each needs at least one project.",
            json_schema_extra=unique_by("legend") | new_item(ProjectCategory(legend="NEW", name="New category")),
        ),
    ]
    projects: Annotated[
        list[Project],
        Field(
            min_length=1,
            max_length=9,
            title="Projects",
            description="1 to 9 projects, one per wingform station.",
            json_schema_extra=unique_by("slug", "station")
            | new_item(
                Project(
                    slug="new-project",
                    station=2,
                    name="NEW PROJECT",
                    code="NEW",
                    store=MissileStore(kind=StoreKind.MISSILE),
                    status=ProjectStatus.STBY,
                    category="NEW",
                    fields=ProjectFields(left=[], right=[]),
                    description="What the project is.",
                    links=[],
                )
            ),
        ),
    ]

    @model_validator(mode="after")
    def consistent(self) -> Self:
        legends = [category.legend for category in self.categories]
        if (index := first_duplicate(legends)) is not None:
            raise ContentRuleError(("categories", index, "legend"), "category legends must be unique")
        if (index := first_duplicate([project.slug for project in self.projects])) is not None:
            raise ContentRuleError(("projects", index, "slug"), "each project needs its own slug")
        if (index := first_duplicate([project.station for project in self.projects])) is not None:
            raise ContentRuleError(("projects", index, "station"), "each project needs its own station")
        for index, project in enumerate(self.projects):
            if project.category not in legends:
                raise ContentRuleError(
                    ("projects", index, "category"), f"projects use categories that do not exist: {project.category}"
                )
        used = {project.category for project in self.projects}
        for index, legend in enumerate(legends):
            if legend not in used:
                raise ContentRuleError(("categories", index, "legend"), f"categories without projects: {legend}")
        return self
