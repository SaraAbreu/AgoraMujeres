import jwt
from dotenv import load_dotenv
load_dotenv()  # Carga el .env ANTES de cualquier otra importación

from fastapi import Depends, FastAPI, HTTPException, Body, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import sys
from datetime import datetime, timezone
from contextlib import asynccontextmanager
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials, initialize_app
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.base import BaseHTTPMiddleware

# --- CONFIGURACIÓN DE LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SyntexiaSecurity")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from auth.auth_utils import create_access_token

# --- FIREBASE ADMIN ---
if not len(firebase_admin._apps):
    key_path = os.path.join(BASE_DIR, "firebase_key.json")
    if os.path.exists(key_path):
        cred = credentials.Certificate(key_path)
        initialize_app(cred)
        logger.info("🔥 Firebase Admin Inicializado")
    else:
        logger.error("❌ No se encontró firebase_key.json")

# --- MODELOS ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ── LIFESPAN ──────────────────────────────────────────────────────────────────
# BUG CORREGIDO: el lifespan anterior creaba su propio AsyncIOMotorClient local
# y asignaba una variable `db` local a server.py, pero core.database.db seguía
# siendo None. Todos los routers usan core.database.db → TypeError en cada request.
#
# La solución correcta es llamar a core.database.connect() / disconnect(),
# que son las únicas funciones que actualizan la variable global core.database.db.

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Importamos aquí para evitar importación circular en el arranque
    from core.database import connect, disconnect
    await connect()           # → establece core.database.db y crea índices
    logger.info("🛡️ Bóveda Syntexia: Canal Seguro Activado")
    yield
    await disconnect()        # → cierra la conexión limpiamente

# --- APP ---
app = FastAPI(title="Ágora Security Engine", lifespan=lifespan)

# --- MIDDLEWARES ---
_allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "")
_allowed_origins = [o.strip() for o in _allowed_origins_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
    return response

# --- SEGURIDAD JWT ---
security = HTTPBearer()
JWT_SECRET = os.environ.get("JWT_SECRET", "CAMBIA_ESTO_EN_PRODUCCION")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        from core.database import db  # import tardío para asegurar que db ya está inicializado
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        email = payload.get("email")
        user_db = await db.users.find_one({"email": email})
        if not user_db:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return {"id": str(user_db["_id"]), "email": email, "profile": user_db.get("profile", {})}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

# --- ENDPOINTS DE AUTENTICACIÓN ---

@app.post("/api/auth/google")
async def google_auth(data: dict = Body(...)):
    from core.database import db
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token no recibido")
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        email = decoded_token["email"]
        name  = decoded_token.get("name", "Usuaria Ágora")

        user_db = await db.users.find_one({"email": email})
        if not user_db:
            result = await db.users.insert_one({
                "email": email,
                "name": name,
                "created_at": datetime.now(timezone.utc),
                "profile": {"menopausia": False},
            })
            user_id = str(result.inserted_id)
        else:
            user_id = str(user_db["_id"])

        access_token = create_access_token(data={"sub": user_id, "email": email})
        return {"status": "success", "token": access_token, "user": {"email": email, "name": name}}
    except Exception as e:
        logger.error(f"❌ Error en Firebase: {e}")
        raise HTTPException(status_code=401, detail="Token inválido")

# --- EMAIL/PASSWORD AUTH ---

@app.post("/api/auth/register")
async def register(data: dict = Body(...)):
    import hashlib, secrets
    from core.database import db
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name     = data.get("name") or email.split("@")[0]

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email y contraseña requeridos")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Este correo ya está registrado")

    salt   = secrets.token_hex(32)
    hashed = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()

    result = await db.users.insert_one({
        "email":      email,
        "name":       name,
        "password":   f"{salt}:{hashed}",
        "created_at": datetime.now(timezone.utc),
        "profile":    {"menopausia": False},
    })
    user_id     = str(result.inserted_id)
    token       = create_access_token(data={"sub": user_id, "email": email})
    return {"status": "success", "token": token, "user": {"email": email, "name": name}}


@app.post("/api/auth/login")
async def login(data: dict = Body(...)):
    import hashlib
    from core.database import db
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email y contraseña requeridos")

    user_db = await db.users.find_one({"email": email})
    if not user_db:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    stored = user_db.get("password")
    if not stored:
        raise HTTPException(status_code=401, detail="Esta cuenta usa inicio de sesión con Google")

    salt, stored_hash = stored.split(":", 1)
    check = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    if check != stored_hash:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")

    user_id = str(user_db["_id"])
    name    = user_db.get("name", email.split("@")[0])
    token   = create_access_token(data={"sub": user_id, "email": email})
    return {"status": "success", "token": token, "user": {"email": email, "name": name}}


# --- HEALTH ---

@app.get("/api/health")
async def health():
    from core.database import db
    try:
        await db.command("ping")
        db_status = "ok"
    except Exception:
        db_status = "degraded"
    return {"status": "ok", "db": db_status}

# --- ME ---

@app.get("/api/me")
async def get_me(user=Depends(get_current_user)):
    return {"user": {"id": user["id"], "email": user["email"], "profile": user.get("profile", {})}}

# --- STATS ---

@app.get("/api/user/stats")
async def get_user_stats(user=Depends(get_current_user)):
    from core.database import db
    email = user["email"]
    glucosa = await db.glucosa.find_one({"email": email}, sort=[("fecha", -1)])
    ciclo   = await db.ciclos.find_one({"email": email}, sort=[("fecha_registro", -1)])

    dia_actual, fase, color = 0, "Sin datos", "#E6D5B8"
    if ciclo and ciclo.get("inicio"):
        try:
            inicio_dt = datetime.fromisoformat(ciclo["inicio"].replace("Z", "+00:00"))
            if inicio_dt.tzinfo is None:
                inicio_dt = inicio_dt.replace(tzinfo=timezone.utc)
            hoy = datetime.now(timezone.utc)
            dias_transcurridos = (hoy - inicio_dt).days
            duracion   = ciclo.get("duracion", 28)
            dia_actual = (dias_transcurridos % duracion) + 1
            if ciclo.get("menopausia"):      fase, color = "PLENITUD",  "#8B5A2B"
            elif 1  <= dia_actual <= 5:       fase, color = "MENSTRUAL", "#C5A059"
            elif 6  <= dia_actual <= 12:      fase, color = "FOLICULAR", "#D1C4B2"
            elif 13 <= dia_actual <= 16:      fase, color = "OVULATORIA","#E6D5B8"
            else:                            fase, color = "LÚTEA",     "#8B5A2B"
        except Exception as e:
            logger.error(f"Error calculando ciclo: {e}")

    return {
        "glucosa": {"valor": glucosa["valor"] if glucosa else 0},
        "ciclo":   {"dia_actual": dia_actual, "fase": fase, "color": color,
                    "duracion": ciclo.get("duracion", 0) if ciclo else 0},
    }

# --- CICLO ---

@app.post("/api/ciclo")
async def save_ciclo(data: dict = Body(...), user=Depends(get_current_user)):
    from core.database import db
    try:
        await db.ciclos.insert_one({
            "email":           user["email"],
            "duracion":        int(data.get("duracion", 0)),
            "inicio":          data.get("inicio"),
            "sintomas":        data.get("sintomas", []),
            "menopausia":      data.get("menopausia", False),
            "notas":           data.get("notas", ""),
            "fecha_registro":  datetime.now(timezone.utc),
        })
        return {"status": "success", "message": "Ciclo registrado"}
    except Exception as e:
        logger.error(f"Error guardando ciclo: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- DIARIO ---

@app.post("/api/diario")
async def save_diario(data: dict = Body(...), user=Depends(get_current_user)):
    from core.database import db
    await db.diario.insert_one({
        "email": user["email"], "texto": data.get("texto"), "fecha": datetime.now(timezone.utc)
    })
    return {"status": "success"}

@app.get("/api/diario")
async def get_diario(user=Depends(get_current_user)):
    from core.database import db
    cursor  = db.diario.find({"email": user["email"]}).sort("fecha", -1)
    entries = await cursor.to_list(length=10)
    return [{"id": str(e["_id"]), "date": e["fecha"].strftime("%d %b"), "text": e["texto"]} for e in entries]

# --- REPORTE MÉDICO ---

@app.get("/api/user/medical-report")
async def get_medical_report(user=Depends(get_current_user)):
    from core.database import db
    email        = user["email"]
    glucosa_logs = await db.glucosa.find({"email": email}).sort("fecha", -1).to_list(50)
    ciclo_logs   = await db.ciclos.find({"email": email}).sort("fecha_registro", -1).to_list(50)
    diario_logs  = await db.diario.find({"email": email}).sort("fecha", -1).to_list(50)

    reporte = []
    for g in glucosa_logs:
        reporte.append({"tipo": "GLUCOSA", "valor": f"{g['valor']} mg/dL", "fecha": g["fecha"], "info": "Nivel de azúcar"})
    for c in ciclo_logs:
        sints = ", ".join(c.get("sintomas", [])) if c.get("sintomas") else "Sin síntomas"
        inicio_val = c.get("inicio")
        inicio_str = str(inicio_val)[:10] if inicio_val is not None else "Desconocida"
        duracion_val = c.get("duracion", "?")
        reporte.append({"tipo": "CICLO", "valor": f"Ciclo de {duracion_val} días", "fecha": c.get("fecha_registro", datetime.now(timezone.utc)),
                        "info": f"Inicio: {inicio_str} | Síntomas: {sints}"})
    for d in diario_logs:
        reporte.append({"tipo": "DIARIO", "valor": "Reflexión", "fecha": d["fecha"], "info": d["texto"]})

    reporte.sort(
        key=lambda x: x["fecha"] if isinstance(x["fecha"], datetime)
                      else datetime.fromisoformat(x["fecha"].replace("Z", "+00:00")),
        reverse=True,
    )
    return reporte

# --- ROUTERS EXTERNOS ---
# Glucosa
try:
    from routers.glucosa import router as glucosa_router
    app.include_router(glucosa_router, prefix="/api")
    logger.info("✅ Router de glucosa activo")
except ImportError:
    logger.warning("Router de glucosa no encontrado, saltando...")

try:
    from routers.checkin import router as checkin_router
    app.include_router(checkin_router, prefix="/api")
    logger.info("✅ Router de check-in activo")
except ImportError:
    logger.warning("Router de check-in no encontrado, saltando...")

# Chat (Ágora)
try:
    from routers.chat import router as chat_router
    app.include_router(chat_router, prefix="/api")
    logger.info("✅ Router de chat Ágora activo en /api/chat")
except ImportError as e:
    logger.warning(f"Router de chat no encontrado: {e}")

# Suscripciones (Stripe)
try:
    from routers.subscriptions import router as subscriptions_router
    app.include_router(subscriptions_router, prefix="/api")
    logger.info("✅ Router de suscripciones activo en /api/subscription")
except ImportError as e:
    logger.warning(f"Router de suscripciones no encontrado: {e}")

# Síntomas crónicos
try:
    from routers.sintomas_cronico import router as sintomas_router
    app.include_router(sintomas_router, prefix="/api")
    logger.info("✅ Router de síntomas crónicos activo")
except ImportError as e:
    logger.warning(f"Router de síntomas no encontrado: {e}")

# --- ARRANQUE ---
if __name__ == "__main__":
    import uvicorn
    port = 8080
    if "--port" in sys.argv:
        try:
            port = int(sys.argv[sys.argv.index("--port") + 1])
        except (IndexError, ValueError):
            pass
    logger.info(f"🚀 Ágora desplegado en http://0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)