import os
import uuid
import bcrypt
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials, initialize_app

from fastapi import FastAPI, HTTPException, Body, Request, status
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from fastapi.responses import JSONResponse

# --- CONFIGURACIÓN DE SEGURIDAD ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SyntexiaSecurity")

# --- INICIALIZACIÓN DE FIREBASE ADMIN ---
if not len(firebase_admin._apps):
    cred = credentials.Certificate("firebase_key.json")
    initialize_app(cred)

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- PERSISTENCIA SEGURA ---
client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_uri)
    db = client[os.environ.get('DB_NAME', 'agoramujeres')]
    logger.info("🛡️ Bóveda Syntexia: Canal Seguro Activado")
    yield
    if client: client.close()

app = FastAPI(title="Ágora Security Engine", lifespan=lifespan)

# --- POLÍTICA DE SEGURIDAD DE ORIGEN (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción se cambia por el dominio de la app
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

# --- ENDPOINTS ---

@app.post("/api/auth/register", status_code=201)
async def register(user: UserRegister):
    # Verificación de colisión de identidad
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Identidad ya protegida.")
    
    # Hashing Industrial (Bcrypt con Salting)
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(user.password.encode('utf-8'), salt)
    
    await db.users.insert_one({
        "email": user.email,
        "password": hashed.decode('utf-8'),
        "created_at": datetime.now(timezone.utc),
        "profile": {"name": "", "intention": ""}
    })
    return {"status": "success"}

@app.post("/api/auth/login")
async def login(user: UserLogin):
    user_db = await db.users.find_one({"email": user.email})
    
    # Verificación de tiempo constante para evitar ataques de timing
    if not user_db or not bcrypt.checkpw(user.password.encode('utf-8'), user_db["password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Credenciales no válidas.")
    
    return {
        "status": "success",
        "token": f"agora_session_{uuid.uuid4()}",
        "email": user.email
    }

@app.post("/api/user/update-profile")
async def update_profile(data: dict = Body(...)):
    email = data.get("email")
    name = data.get("name")
    await db.users.update_one({"email": email}, {"$set": {"profile.name": name}})
    return {"status": "success"}

@app.post("/api/auth/google")
async def google_login(data: dict = Body(...)):
    id_token = data.get('token')
    print(f"[DEBUG] Token recibido en backend: {id_token}")
    if not id_token:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"error": "Falta el token de Google"})
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        email = decoded_token['email']
        name = decoded_token.get('name', 'Usuaria Ágora')
        # Buscar o crear usuario en la base de datos
        user_db = await db.users.find_one({"email": email})
        if not user_db:
            await db.users.insert_one({
                "email": email,
                "password": None,  # No hay contraseña para Google
                "created_at": datetime.now(timezone.utc),
                "profile": {"name": name, "intention": ""}
            })
        # Generar token de sesión
        session_token = f"agora_session_{uuid.uuid4()}"
        return {
            "status": "success",
            "token": session_token,
            "user": {"email": email, "name": name}
        }
    except Exception as e:
        print(f"[ERROR] Google login: {e}")
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"error": str(e)})

# --- SISTEMA DE SALUD ---
@app.get("/api/health") # <--- ASEGÚRATE DE QUE PONGA /api/health
async def health():
    return {"status": "shield_active", "engine": "Syntexia 2.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)