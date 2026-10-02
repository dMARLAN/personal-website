"""Admin drafts: a section's unpublished edit, which preview renders (docs/design.md section 13.9).

One explicit GET/PUT pair per section, as in `admin/content/route.py`, so OpenAPI types each draft exactly. A PUT
validates like a publish (422 if the document cannot render) but changes nothing on the site, so it revalidates
nothing. Publishing (`PUT /api/admin/content/{section}`) deletes the section's draft.
"""

from typing import Annotated, Final

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, status

from auth.admin import require_admin, require_admin_write
from container import Container
from content.bit import Bit
from content.checklist import Checklist
from content.contact import Contact
from content.fcs import FlightControls
from content.fuel import FuelReserves
from content.links import Links
from content.mumi import MissionData
from content.profile import Profile
from content.projects import Projects
from content.radar import RadarScene
from content.resume import Resume
from content.sections import (
    BIT,
    CHECKLIST,
    CONTACT,
    FCS,
    FUEL,
    LINKS,
    MUMI,
    PROFILE,
    PROJECTS,
    RADAR,
    RESUME,
    SERVER,
    WORK,
    ContentSection,
)
from content.server import ServerStats
from content.work import Work
from services.content.service import ContentService
from services.content.types import Drafts, SectionDraft

router = APIRouter(dependencies=[Depends(require_admin)])

# A plain alias, not a `type` statement: dependency-injector's wiring reads the `Provide` marker out of the Annotated
# metadata at runtime, which a TypeAliasType hides.
ContentServiceDep = Annotated[ContentService, Depends(Provide[Container.content_service])]

_GET_RESPONSES: Final[dict[int | str, dict[str, str]]] = {
    status.HTTP_404_NOT_FOUND: {"description": "The section has no draft."},
}
_WRITE_RESPONSES: Final[dict[int | str, dict[str, str]]] = {
    status.HTTP_403_FORBIDDEN: {"description": "Missing or wrong `X-CSRF-Token`."},
}


@router.get("", operation_id="adminGetDrafts")
@inject
async def get_drafts(content_service: ContentServiceDep) -> Drafts:
    return await content_service.drafts()


@router.delete(
    "/{section}",
    operation_id="adminDeleteDraft",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def delete_draft(section: ContentSection, content_service: ContentServiceDep) -> None:
    """Discard the section's draft. Answers 204 whether or not it had one."""
    await content_service.delete_draft(section)


@router.get("/profile", operation_id="adminGetProfileDraft", responses=_GET_RESPONSES)
@inject
async def get_profile_draft(content_service: ContentServiceDep) -> SectionDraft[Profile]:
    return await content_service.get_draft(PROFILE)


@router.put(
    "/profile",
    operation_id="adminPutProfileDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_profile_draft(document: Profile, content_service: ContentServiceDep) -> SectionDraft[Profile]:
    return await content_service.save_draft(PROFILE, document)


@router.get("/resume", operation_id="adminGetResumeDraft", responses=_GET_RESPONSES)
@inject
async def get_resume_draft(content_service: ContentServiceDep) -> SectionDraft[Resume]:
    return await content_service.get_draft(RESUME)


@router.put(
    "/resume",
    operation_id="adminPutResumeDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_resume_draft(document: Resume, content_service: ContentServiceDep) -> SectionDraft[Resume]:
    return await content_service.save_draft(RESUME, document)


@router.get("/work", operation_id="adminGetWorkDraft", responses=_GET_RESPONSES)
@inject
async def get_work_draft(content_service: ContentServiceDep) -> SectionDraft[Work]:
    return await content_service.get_draft(WORK)


@router.put(
    "/work",
    operation_id="adminPutWorkDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_work_draft(document: Work, content_service: ContentServiceDep) -> SectionDraft[Work]:
    return await content_service.save_draft(WORK, document)


@router.get("/projects", operation_id="adminGetProjectsDraft", responses=_GET_RESPONSES)
@inject
async def get_projects_draft(content_service: ContentServiceDep) -> SectionDraft[Projects]:
    return await content_service.get_draft(PROJECTS)


@router.put(
    "/projects",
    operation_id="adminPutProjectsDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_projects_draft(document: Projects, content_service: ContentServiceDep) -> SectionDraft[Projects]:
    return await content_service.save_draft(PROJECTS, document)


@router.get("/contact", operation_id="adminGetContactDraft", responses=_GET_RESPONSES)
@inject
async def get_contact_draft(content_service: ContentServiceDep) -> SectionDraft[Contact]:
    return await content_service.get_draft(CONTACT)


@router.put(
    "/contact",
    operation_id="adminPutContactDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_contact_draft(document: Contact, content_service: ContentServiceDep) -> SectionDraft[Contact]:
    return await content_service.save_draft(CONTACT, document)


@router.get("/links", operation_id="adminGetLinksDraft", responses=_GET_RESPONSES)
@inject
async def get_links_draft(content_service: ContentServiceDep) -> SectionDraft[Links]:
    return await content_service.get_draft(LINKS)


@router.put(
    "/links",
    operation_id="adminPutLinksDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_links_draft(document: Links, content_service: ContentServiceDep) -> SectionDraft[Links]:
    return await content_service.save_draft(LINKS, document)


@router.get("/server", operation_id="adminGetServerDraft", responses=_GET_RESPONSES)
@inject
async def get_server_draft(content_service: ContentServiceDep) -> SectionDraft[ServerStats]:
    return await content_service.get_draft(SERVER)


@router.put(
    "/server",
    operation_id="adminPutServerDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_server_draft(document: ServerStats, content_service: ContentServiceDep) -> SectionDraft[ServerStats]:
    return await content_service.save_draft(SERVER, document)


@router.get("/fuel", operation_id="adminGetFuelDraft", responses=_GET_RESPONSES)
@inject
async def get_fuel_draft(content_service: ContentServiceDep) -> SectionDraft[FuelReserves]:
    return await content_service.get_draft(FUEL)


@router.put(
    "/fuel",
    operation_id="adminPutFuelDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_fuel_draft(document: FuelReserves, content_service: ContentServiceDep) -> SectionDraft[FuelReserves]:
    return await content_service.save_draft(FUEL, document)


@router.get("/fcs", operation_id="adminGetFcsDraft", responses=_GET_RESPONSES)
@inject
async def get_fcs_draft(content_service: ContentServiceDep) -> SectionDraft[FlightControls]:
    return await content_service.get_draft(FCS)


@router.put(
    "/fcs",
    operation_id="adminPutFcsDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_fcs_draft(document: FlightControls, content_service: ContentServiceDep) -> SectionDraft[FlightControls]:
    return await content_service.save_draft(FCS, document)


@router.get("/checklist", operation_id="adminGetChecklistDraft", responses=_GET_RESPONSES)
@inject
async def get_checklist_draft(content_service: ContentServiceDep) -> SectionDraft[Checklist]:
    return await content_service.get_draft(CHECKLIST)


@router.put(
    "/checklist",
    operation_id="adminPutChecklistDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_checklist_draft(document: Checklist, content_service: ContentServiceDep) -> SectionDraft[Checklist]:
    return await content_service.save_draft(CHECKLIST, document)


@router.get("/bit", operation_id="adminGetBitDraft", responses=_GET_RESPONSES)
@inject
async def get_bit_draft(content_service: ContentServiceDep) -> SectionDraft[Bit]:
    return await content_service.get_draft(BIT)


@router.put(
    "/bit",
    operation_id="adminPutBitDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_bit_draft(document: Bit, content_service: ContentServiceDep) -> SectionDraft[Bit]:
    return await content_service.save_draft(BIT, document)


@router.get("/radar", operation_id="adminGetRadarDraft", responses=_GET_RESPONSES)
@inject
async def get_radar_draft(content_service: ContentServiceDep) -> SectionDraft[RadarScene]:
    return await content_service.get_draft(RADAR)


@router.put(
    "/radar",
    operation_id="adminPutRadarDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_radar_draft(document: RadarScene, content_service: ContentServiceDep) -> SectionDraft[RadarScene]:
    return await content_service.save_draft(RADAR, document)


@router.get("/mumi", operation_id="adminGetMumiDraft", responses=_GET_RESPONSES)
@inject
async def get_mumi_draft(content_service: ContentServiceDep) -> SectionDraft[MissionData]:
    return await content_service.get_draft(MUMI)


@router.put(
    "/mumi",
    operation_id="adminPutMumiDraft",
    dependencies=[Depends(require_admin_write)],
    responses=_WRITE_RESPONSES,
)
@inject
async def put_mumi_draft(document: MissionData, content_service: ContentServiceDep) -> SectionDraft[MissionData]:
    return await content_service.save_draft(MUMI, document)
