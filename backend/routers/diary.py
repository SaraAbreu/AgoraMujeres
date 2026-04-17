from fastapi import APIRouter, status, Depends, HTTPException
from auth.dependencies import get_current_user
from core.database import db, db_find, db_insert_one
from core.models import DiaryEntry, DiaryEntryCreate
from core.crypto_utils import encrypt_text, decrypt_text

router = APIRouter(prefix="/diary", tags=["diary"])

@router.post("", response_model=DiaryEntry, status_code=status.HTTP_201_CREATED)
async def create_entry(entry: DiaryEntryCreate, user=Depends(get_current_user)):
    import core.database as cdb
    data = entry.model_dump()
    data["content"] = encrypt_text(data["content"])
    new_entry = DiaryEntry(**data)
    await db_insert_one(cdb.db.diary_entries, new_entry.model_dump())
    # Devuelve el contenido descifrado para el frontend
    new_entry.content = entry.content
    return new_entry

@router.get("/{device_id}")
async def get_entries(device_id: str, limit: int = 30, offset: int = 0, user=Depends(get_current_user)):
    # Validar que el usuario solo accede a su propio device_id
    if hasattr(user, 'device_id') and user.device_id != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    import core.database as cdb
    entries = await db_find(
        cdb.db.diary_entries,
        {"device_id": device_id},
        sort=("created_at", -1),
        limit=limit,
        skip=offset,
    )
    result = []
    for e in entries:
        try:
            e["content"] = decrypt_text(e["content"])
        except Exception:
            e["content"] = "[ERROR: No se pudo descifrar]"
        result.append(DiaryEntry(**e))
    return result

@router.get("/{device_id}/patterns")
async def get_patterns(device_id: str, days: int = 7, user=Depends(get_current_user)):
    if hasattr(user, 'device_id') and user.device_id != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    import core.database as cdb
    from core.patterns import get_patterns_for_device
    result = await get_patterns_for_device(device_id, days)
    if result is None:
        return {"patterns": None, "message": "No hay suficientes datos"}
    return result
