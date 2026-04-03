from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import auth as firebase_auth

# 🔐 tus utils
from auth.auth_utils import create_access_token
import auth.firebase_config  # inicializa firebase

router = APIRouter()

class SocialLoginRequest(BaseModel):
    token: str


@router.post("/auth/social-login")
async def social_login(data: SocialLoginRequest):
    try:
        # 🔥 verificar token de firebase
        decoded_token = firebase_auth.verify_id_token(data.token)

        uid = decoded_token["uid"]
        email = decoded_token.get("email")
        name = decoded_token.get("name")

        # 🔥 generar token propio
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