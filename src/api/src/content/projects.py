from enum import StrEnum, auto
from typing import Annotated, Final, Literal, Self

from pydantic import AfterValidator, Field, model_validator

from content.base import ContentModel
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


class MissileStore(ContentModel):
    kind: Literal[StoreKind.MISSILE]


class PairStore(ContentModel):
    kind: Literal[StoreKind.PAIR]


class RackStore(ContentModel):
    kind: Literal[StoreKind.RACK]
    # The number of parts the project ships as; two digits at most.
    amount: Annotated[int, Field(ge=1, le=99)]


class TankStore(ContentModel):
    kind: Literal[StoreKind.TANK]


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


class ProjectCategory(ContentModel):
    legend: Annotated[str, Field(min_length=1, max_length=7), GLYPHS]
    # The accessible name and semantic heading; never drawn.
    name: Annotated[str, Field(min_length=1)]


class LeftField(ContentModel):
    """PROG block, left column: label and value each ≤ 7 (F100, 130 DI columns)."""

    label: Annotated[str, Field(min_length=1, max_length=7), GLYPHS]
    value: Annotated[str, Field(min_length=1, max_length=7), GLYPHS]


class RightField(ContentModel):
    label: Annotated[str, Field(min_length=1, max_length=7), GLYPHS]
    value: Annotated[str, Field(min_length=1, max_length=15), GLYPHS]


class ProjectFields(ContentModel):
    left: Annotated[list[LeftField], Field(max_length=5)]
    right: Annotated[list[RightField], Field(max_length=5)]


class LinkKind(StrEnum):
    """The DATA sublevel legend: `REPO` at PB16, `DEMO` at PB19."""

    REPO = "REPO"
    DEMO = "DEMO"


class ProjectLink(ContentModel):
    kind: LinkKind
    url: Annotated[str, Field(pattern=r"^https://\S+$")]


class Project(ContentModel):
    slug: Slug
    station: Annotated[int, Field(ge=1, le=9)]
    name: Annotated[str, Field(min_length=1, max_length=22), GLYPHS]
    code: Annotated[str, Field(min_length=1, max_length=6), GLYPHS]
    store: ProjectStore
    status: ProjectStatus
    # A `ProjectCategory.legend`.
    category: str
    fields: ProjectFields
    # The DATA sublevel: 7 rows of 47 characters at F100.
    description: Annotated[str, Field(min_length=1), GLYPHS, AfterValidator(FitsRows(chars=47, rows=7))]
    links: list[ProjectLink]

    @model_validator(mode="after")
    def fits_station(self) -> Self:
        if self.store.kind not in _STATION_LOADS[self.station]:
            raise ValueError(f"station {self.station} cannot carry a {self.store.kind} store")
        kinds = [link.kind for link in self.links]
        if len(set(kinds)) != len(kinds):
            raise ValueError("a project has at most one link of each kind")
        return self


class Projects(ContentModel):
    """Projects → STORES (docs/pages/projects.md): one category per top-row OSB (PB6–10), one project per station."""

    categories: Annotated[list[ProjectCategory], Field(min_length=1, max_length=5)]
    projects: Annotated[list[Project], Field(min_length=1, max_length=9)]

    @model_validator(mode="after")
    def consistent(self) -> Self:
        legends = [category.legend for category in self.categories]
        if len(set(legends)) != len(legends):
            raise ValueError("category legends must be unique")
        if len({project.slug for project in self.projects}) != len(self.projects):
            raise ValueError("each project needs its own slug")
        if len({project.station for project in self.projects}) != len(self.projects):
            raise ValueError("each project needs its own station")
        if strays := sorted({project.category for project in self.projects} - set(legends)):
            raise ValueError(f"projects use categories that do not exist: {', '.join(strays)}")
        if empty := [legend for legend in legends if all(project.category != legend for project in self.projects)]:
            raise ValueError(f"categories without projects: {', '.join(empty)}")
        return self
