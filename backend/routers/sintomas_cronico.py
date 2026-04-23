from fastapi import APIRouter, status, Depends, HTTPException
from auth.dependencies import get_current_user
# IMPORTANTE: Importa 'db' aquí
from core.database import db, db_insert_one, db_find 
from core.models import SintomaCronicoRegistro

router = APIRouter(prefix="/sintomas-cronico", tags=["sintomas-cronico"])

@router.post("", response_model=SintomaCronicoRegistro, status_code=status.HTTP_201_CREATED)
async def create_sintoma_registro(data: SintomaCronicoRegistro, user=Depends(get_current_user)):
    # Solo permite registrar para el propio device_id
    if hasattr(user, 'device_id') and user.device_id != data.device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Accedemos a la colección a través del objeto db importado
    await db_insert_one(db.sintomas_cronico, data.model_dump())
    return data

@router.get("/{device_id}")
async def get_sintomas_registros(device_id: str, limit: int = 30, offset: int = 0, user=Depends(get_current_user)):
    if hasattr(user, 'device_id') and user.device_id != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Accedemos a la colección a través del objeto db importado
    registros = await db_find(
        db.sintomas_cronico,
        {"device_id": device_id},
        sort=("created_at", -1),
        limit=limit,
        skip=offset,
    )
    return [SintomaCronicoRegistro(**r) for r in registros]