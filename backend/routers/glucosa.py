from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from core.models import GlucosaRegistro
from core.database import db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os

router = APIRouter(prefix="/api/glucosa", tags=["glucosa"])

security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'CAMBIA_ESTO_EN_PRODUCCION')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get('uid')
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

class GlucosaRegistroIn(BaseModel):
    valor: float = Field(..., gt=0, description="Valor de glucosa en mg/dL")
    fecha: datetime

@router.post("/", status_code=201)
async def registrar_glucosa(
    registro: GlucosaRegistroIn,
    user_id=Depends(get_current_user)
):
    doc = GlucosaRegistro(
        user_id=user_id,
        valor=registro.valor,
        fecha=registro.fecha
    ).model_dump()
    await db.glucosa.insert_one(doc)
    return {"ok": True, "valor": registro.valor, "fecha": registro.fecha}
