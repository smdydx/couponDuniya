"""Feature flags administration API."""
from fastapi import APIRouter, HTTPException, Depends
from ...feature_flags import list_flags, get_flag, set_flag
from ...dependencies import require_admin

router = APIRouter(prefix="/flags", tags=["System"])


@router.get("/")
async def flags_list():
    return {"flags": list_flags()}


@router.get("/{name}")
async def flag_get(name: str):
    return {"name": name, "enabled": get_flag(name, False)}


@router.put("/{name}")
async def flag_set(name: str, enabled: bool, _: object = Depends(require_admin)):
    if not isinstance(enabled, bool):
        raise HTTPException(status_code=400, detail="enabled must be boolean")
    set_flag(name, enabled)
    return {"name": name, "enabled": enabled}