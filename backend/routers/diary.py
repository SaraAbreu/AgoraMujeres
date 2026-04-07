from fastapi import APIRouter, status
from core.database import db, db_find, db_insert_one
from core.models import DiaryEntry, DiaryEntryCreate

router = APIRouter(prefix="/diary", tags=["diary"])

@router.post("", response_model=DiaryEntry, status_code=status.HTTP_201_CREATED)
async def create_entry(entry: DiaryEntryCreate):
    import core.database as cdb
    new_entry = DiaryEntry(**entry.model_dump())
    await db_insert_one(cdb.db.diary_entries, new_entry.model_dump())
    return new_entry

@router.get("/{device_id}")
async def get_entries(device_id: str, limit: int = 30, offset: int = 0):
    import core.database as cdb
    entries = await db_find(
        cdb.db.diary_entries,
        {"device_id": device_id},
        sort=("created_at", -1),
        limit=limit,
        skip=offset,
    )
    return [DiaryEntry(**e) for e in entries]

@router.get("/{device_id}/patterns")
async def get_patterns(device_id: str, days: int = 7):
    import core.database as cdb
    from core.patterns import get_patterns_for_device
    result = await get_patterns_for_device(device_id, days)
    if result is None:
        return {"patterns": None, "message": "No hay suficientes datos"}
    return result
