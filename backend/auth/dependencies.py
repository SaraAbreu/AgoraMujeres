from fastapi import Depends, HTTPException, Header
from jose import jwt, JWTError
from auth.auth_utils import SECRET_KEY, ALGORITHM

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No hay token")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Formato de token inválido")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("uid")
        email = payload.get("email")
        device_id = payload.get("device_id")
        if not uid:
            raise HTTPException(status_code=401, detail="Token inválido: falta uid")
        return {"uid": uid, "email": email, "device_id": device_id}
    except (JWTError, ValueError) as e:
        raise HTTPException(status_code=401, detail="Token inválido")