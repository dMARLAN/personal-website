from fastapi import APIRouter

router = APIRouter()


@router.get("/health", operation_id="healthCheck")
async def health() -> dict[str, str]:
    return {"status": "ok"}
