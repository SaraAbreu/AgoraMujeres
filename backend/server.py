import jwt
from fastapi import Depends, FastAPI, HTTPException, Body, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
import os
import uuid
import bcrypt
import logging
import sys
from datetime import datetime, timezone
from contextlib import asynccontextmanager
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials, initialize_app
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

# Import local
from auth.auth_utils import create_access_token

# --- CONFIGURACIÓN DE SEGURIDAD Y RUTAS ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SyntexiaSecurity")

# Obtener la ruta base para encontrar archivos (como firebase_key.json)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Añadir BASE_DIR al path para que los imports internos (auth, routers) funcionen siempre
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# --- INICIALIZACIÓN DE FIREBASE ADMIN ---
if not len(firebase_admin._apps):
    # CORRECCIÓN DE RUTA: Busca el archivo en la misma carpeta que server.py
    key_path = os.path.join(BASE_DIR, "firebase_key.json")
    if not os.path.exists(key_path):
        logger.error(f"❌ No se encontró el archivo Firebase en: {key_path}")
    else:
        cred = credentials.Certificate(key_path)
        initialize_app(cred)
        logger.info("🔥 Firebase Admin Inicializado")

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SEGURIDAD JWT ---
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'CAMBIA_ESTO_EN_PRODUCCION')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        email = payload.get('email')
        if not email:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user_db = await db.users.find_one({"email": email})
        if not user_db:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return {
            "id": str(user_db.get('_id', '')),
            "email": user_db.get('email', ''),
            "name": user_db.get('profile', {}).get('name', ''),
            "plan": user_db.get('plan', 'free')
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

# --- ENDPOINTS ---

@app.get("/api/health")
async def health():
    return {"status": "shield_active", "engine": "Syntexia 2.0"}

@app.get("/api/me")
async def get_me(user=Depends(get_current_user)):
    return {"user": user}

@app.post("/api/auth/register", status_code=201)
async def register(user: UserRegister):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Identidad ya protegida.")
    
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
    if not user_db or not bcrypt.checkpw(user.password.encode('utf-8'), user_db["password"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Credenciales no válidas.")
    
    payload = {"uid": str(user_db['_id']), "email": user.email}
    token = create_access_token(payload)
    return {"status": "success", "token": token, "email": user.email}

@app.post("/api/auth/google")
async def google_login(data: dict = Body(...)):
    id_token = data.get('token')
    if not id_token:
        return JSONResponse(status_code=422, content={"error": "Falta el token de Google"})
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        email = decoded_token['email']
        name = decoded_token.get('name', 'Usuaria Ágora')
        
        user_db = await db.users.find_one({"email": email})
        if not user_db:
            await db.users.insert_one({
                "email": email,
                "password": None,
                "created_at": datetime.now(timezone.utc),
                "profile": {"name": name, "intention": ""}
            })
            user_db = await db.users.find_one({"email": email})

        payload = {"uid": str(user_db['_id']), "email": email}
        token = create_access_token(payload)
        return {
            "status": "success",
            "token": token,
            "user": {"email": email, "name": name}
        }
    except Exception as e:
        logger.error(f"Google login error: {e}")
        return JSONResponse(status_code=401, content={"error": str(e)})

@app.post("/api/user/update-profile")
async def update_profile(data: dict = Body(...)):
    email = data.get("email")
    name = data.get("name")
    await db.users.update_one({"email": email}, {"$set": {"profile.name": name}})
    return {"status": "success"}
# --- ENDPOINT COMUNIDAD (Para que desaparezca el error 404) ---
@app.get("/chat/community/count")
async def get_community_count():
    return {
        "community_size": 161, 
        "message_es": "161 mujeres están cultivando su bienestar hoy"
    }
# --- INCLUSIÓN DE ROUTERS ---
# Modifica la inclusión de los routers para que usen el prefijo /api
try:
    from routers.glucosa import router as glucosa_router
    from routers.sintomas_cronico import router as sintomas_cronico_router
    
    # Añadimos el prefijo /api para que coincida con lo que busca el frontend
    app.include_router(glucosa_router, prefix="/api")
    app.include_router(sintomas_cronico_router, prefix="/api")
    
    logger.info("✅ Routers cargados con prefijo /api")
except ImportError as e:
    logger.warning(f"⚠️ No se pudo cargar algún router: {e}")
# En server.py o routers/glucosa.py
@app.get("/api/user/stats")
async def get_user_stats(user=Depends(get_current_user)):
    # Buscamos el último registro de glucosa del usuario en MongoDB
    ultima_glucosa = await db.glucosa.find_one(
        {"email": user["email"]}, 
        sort=[("fecha", -1)]
    )
    
    # Buscamos el último ciclo
    ultimo_ciclo = await db.ciclos.find_one(
        {"email": user["email"]}, 
        sort=[("fecha_registro", -1)]
    )
    
    return {
        "glucosa": {
            "valor": ultima_glucosa["valor"] if ultima_glucosa else 0,
            "fecha": ultima_glucosa["fecha"] if ultima_glucosa else None
        },
        "ciclo": {
            "duracion": ultimo_ciclo["duracion"] if ultimo_ciclo else 0,
            "inicio": ultimo_ciclo["inicio"] if ultimo_ciclo else None
        }
    }
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)