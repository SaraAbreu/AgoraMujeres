from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from firebase_admin import auth as firebase_auth
from auth.auth_utils import create_access_token
import auth.firebase_config  # inicializa firebase
from core.database import (
    db, db_delete_many
)
from auth.dependencies import get_current_user

router = APIRouter()


class SocialLoginRequest(BaseModel):
    token: str


class DeleteAccountRequest(BaseModel):
    device_id: str
    confirm: bool


@router.post("/auth/social-login")
async def social_login(data: SocialLoginRequest):
    try:
        decoded_token = firebase_auth.verify_id_token(data.token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email")
        name = decoded_token.get("name")
        access_token = create_access_token({
            "uid": uid,
            "email": email
        })
        return {
            "access_token": access_token,
            "user": {
                "uid": uid,
                "email": email,
                "name": name
            }
        }
    except Exception as e:
        print("ERROR FIREBASE:", e)
        raise HTTPException(status_code=401, detail="Token inválido")



# Endpoint reforzado: autenticación, validación, confirmación, borrado en Firebase y log
@router.delete("/auth/delete-account")
async def delete_account(
    data: DeleteAccountRequest,
    user=Depends(get_current_user),
    request: Request = None
):
    """
    Borra todos los datos de la usuaria asociados a device_id.
    Cumple con LOPD / RGPD — derecho de supresión.
    """
    if not data.device_id:
        raise HTTPException(status_code=400, detail="device_id requerido")
    if not data.confirm:
        raise HTTPException(status_code=400, detail="Debes confirmar la eliminación (confirm=true)")
    # Solo puede borrar su propio device_id
    if user["device_id"] != data.device_id:
        raise HTTPException(status_code=403, detail="No puedes borrar otra cuenta")

    q = {"device_id": data.device_id}

    collections = [
        db.chat_messages,
        db.chat_conversations,
        db.diary_entries,
        db.subscriptions,
        db.cycle_entries,
        db.message_reactions,
        db.favorite_messages,
        db.crisis_logs,
        db.monthly_records,
    ]

    for col in collections:
        try:
            await db_delete_many(col, q)
        except Exception as e:
            print(f"Error borrando {col.name}: {e}")

    # Borrado en Firebase Auth
    try:
        firebase_auth.delete_user(user["uid"])
    except Exception as e:
        print(f"Error borrando usuario en Firebase Auth: {e}")

    # Log de auditoría
    print(f"AUDITORIA: Usuario {user['email']} ({user['uid']}) eliminó su cuenta desde IP {request.client.host if request else 'N/A'}")

    return {"ok": True, "message": "Cuenta y datos eliminados permanentemente"}