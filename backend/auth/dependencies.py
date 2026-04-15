from fastapi import Depends, HTTPException, Header
import logging

# Simulación de verificación (Stubs) para que no dé error
async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No hay token")
    # Aquí irá la lógica de Firebase después
    return {"uid": "user_123", "email": "test@test.com"}