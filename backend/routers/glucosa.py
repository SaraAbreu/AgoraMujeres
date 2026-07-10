from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import core.database as core_db
from auth.dependencies import get_current_user

router = APIRouter(prefix="/glucosa", tags=["glucosa"])


class GlucosaRegistroIn(BaseModel):
    valor: float = Field(..., gt=0, description="Valor de glucosa en mg/dL")
    fecha: datetime


@router.post("/", status_code=201)
async def registrar_glucosa(
    registro: GlucosaRegistroIn,
    user=Depends(get_current_user),
):
    # Se guarda por email, igual que /api/ciclo y /api/diario en server.py,
    # que es el identificador que usan /api/user/stats y /api/user/medical-report
    # para leer estos registros. Antes se guardaba por user_id, así que esas
    # lecturas nunca encontraban nada.
    doc = {
        "email": user["email"],
        "valor": registro.valor,
        "fecha": registro.fecha,
        "created_at": datetime.now(timezone.utc),
    }
    await core_db.db.glucosa.insert_one(doc)
    return {"ok": True, "valor": registro.valor, "fecha": registro.fecha}
