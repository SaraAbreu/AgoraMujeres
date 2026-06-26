from fastapi import APIRouter, status, Depends, HTTPException
from auth.dependencies import get_current_user
from core.database import db, db_insert_one, db_find
from core.models import DailyCheckIn, DailyCheckInCreate
from datetime import datetime, timezone

router = APIRouter(prefix="/checkin", tags=["checkin"])

@router.post("", response_model=DailyCheckIn, status_code=status.HTTP_201_CREATED)
async def create_checkin(data: DailyCheckInCreate, user=Depends(get_current_user)):
    if hasattr(user, 'device_id') and user.device_id != data.device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    checkin = DailyCheckIn(**data.model_dump())
    await db_insert_one(db.daily_checkins, checkin.model_dump())
    return checkin

@router.get("/{device_id}")
async def get_checkins(device_id: str, limit: int = 90, user=Depends(get_current_user)):
    if hasattr(user, 'device_id') and user.device_id != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    registros = await db_find(
        db.daily_checkins,
        {"device_id": device_id},
        sort=("created_at", -1),
        limit=limit,
    )
    return [DailyCheckIn(**r) for r in registros]

@router.get("/{device_id}/today")
async def get_today_checkin(device_id: str, user=Depends(get_current_user)):
    if hasattr(user, 'device_id') and user.device_id != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    hoy = datetime.now(timezone.utc).date()
    registros = await db_find(
        db.daily_checkins,
        {"device_id": device_id},
        sort=("created_at", -1),
        limit=1,
    )
    if not registros:
        return None
    ultimo = registros[0]
    fecha = ultimo["created_at"]
    if isinstance(fecha, str):
        fecha = datetime.fromisoformat(fecha.replace("Z", "+00:00"))
    if fecha.date() == hoy:
        return DailyCheckIn(**ultimo)
    return None
