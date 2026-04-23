
import os
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = os.environ.get('JWT_SECRET', 'CAMBIA_ESTO_EN_PRODUCCION')
ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
