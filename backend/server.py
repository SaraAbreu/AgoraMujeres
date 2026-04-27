import jwt
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

# --- CONFIGURACIÓN DE SEGURIDAD Y LOGGING ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SyntexiaSecurity")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# Import local (Asegúrate de que este archivo existe)
from auth.auth_utils import create_access_token

# --- INICIALIZACIÓN DE FIREBASE ADMIN ---
if not len(firebase_admin._apps):
    key_path = os.path.join(BASE_DIR, "firebase_key.json")
    if os.path.exists(key_path):
        cred = credentials.Certificate(key_path)
        initialize_app(cred)
        logger.info("🔥 Firebase Admin Inicializado")
    else:
        logger.error("❌ No se encontró firebase_key.json")

# --- MODELOS DE DATOS ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- PERSISTENCIA (MONGODB) ---
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

# --- INICIALIZACIÓN DE APP (UNA SOLA VEZ) ---
app = FastAPI(title="Ágora Security Engine", lifespan=lifespan)

# --- MIDDLEWARES ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Esto soluciona el aviso de COOP en Chrome
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
    return response

# --- SEGURIDAD JWT ---
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'CAMBIA_ESTO_EN_PRODUCCION')

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        email = payload.get('email')
        user_db = await db.users.find_one({"email": email})
        if not user_db: 
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return {"id": str(user_db['_id']), "email": email, "profile": user_db.get('profile', {})}
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")

# --- ENDPOINTS DE AUTENTICACIÓN ---
# --- BUSCA Y SUSTITUYE ESTA PARTE EN SERVER.PY ---

@app.post("/api/auth/google") # Asegúrate de que NO haya una barra al final
async def google_auth(data: dict = Body(...)):
    logger.info("📩 Petición detectada físicamente en /api/auth/google")
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token no recibido")

    try:
        # Validar con Firebase Admin
        decoded_token = firebase_auth.verify_id_token(token)
        email = decoded_token['email']
        name = decoded_token.get('name', 'Usuaria Ágora')

        # Persistencia en MongoDB
        user_db = await db.users.find_one({"email": email})
        if not user_db:
            new_user = {
                "email": email,
                "name": name,
                "created_at": datetime.now(timezone.utc),
                "profile": {"menopausia": False}
            }
            result = await db.users.insert_one(new_user)
            user_id = str(result.inserted_id)
        else:
            user_id = str(user_db["_id"])

        # Generar token JWT para la sesión de la App
        access_token = create_access_token(data={"sub": user_id, "email": email})
        
        return {
            "status": "success",
            "token": access_token,
            "user": {"email": email, "name": name}
        }
    except Exception as e:
        logger.error(f"❌ Error en Firebase: {e}")
        raise HTTPException(status_code=401, detail="Token inválido")

# --- ENDPOINTS DE SALUD Y ESTADÍSTICAS ---

@app.get("/api/user/stats")
async def get_user_stats(user=Depends(get_current_user)):
    email = user["email"]
    glucosa = await db.glucosa.find_one({"email": email}, sort=[("fecha", -1)])
    ciclo = await db.ciclos.find_one({"email": email}, sort=[("fecha_registro", -1)])
    
    dia_actual, fase, color = 0, "Sin datos", "#E6D5B8"
    
    if ciclo and ciclo.get("inicio"):
        try:
            inicio_dt = datetime.fromisoformat(ciclo["inicio"].replace('Z', '+00:00'))
            if inicio_dt.tzinfo is None:
                inicio_dt = inicio_dt.replace(tzinfo=timezone.utc)
                
            hoy = datetime.now(timezone.utc)
            dias_transcurridos = (hoy - inicio_dt).days
            duracion = ciclo.get("duracion", 28)
            
            dia_actual = (dias_transcurridos % duracion) + 1
            
            if ciclo.get("menopausia"):
                fase, color = "PLENITUD", "#8B5A2B"
            elif 1 <= dia_actual <= 5:
                fase, color = "MENSTRUAL", "#C5A059"
            elif 6 <= dia_actual <= 12:
                fase, color = "FOLICULAR", "#D1C4B2"
            elif 13 <= dia_actual <= 16:
                fase, color = "OVULATORIA", "#E6D5B8"
            else:
                fase, color = "LÚTEA", "#8B5A2B"
        except Exception as e:
            logger.error(f"Error calculando ciclo: {e}")

    return {
    "glucosa": {"valor": glucosa["valor"] if glucosa else 0},
    "ciclo": {
        "dia_actual": dia_actual,
        "fase": fase,
        "color": color,
        "duracion": ciclo.get("duracion", 0) if ciclo else 0  # ← añadir
    }
}

@app.post("/api/ciclo")
async def save_ciclo(data: dict = Body(...), user=Depends(get_current_user)):
    try:
        nuevo_ciclo = {
            "email": user["email"],
            "duracion": int(data.get("duracion", 0)),
            "inicio": data.get("inicio"), 
            "sintomas": data.get("sintomas", []),
            "menopausia": data.get("menopausia", False),
            "notas": data.get("notas", ""),
            "fecha_registro": datetime.now(timezone.utc)
        }
        await db.ciclos.insert_one(nuevo_ciclo)
        return {"status": "success", "message": "Ciclo registrado"}
    except Exception as e:
        logger.error(f"Error guardando ciclo: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- ENDPOINTS DE DIARIO ---

@app.post("/api/diario")
async def save_diario(data: dict = Body(...), user=Depends(get_current_user)):
    entry = {
        "email": user["email"], 
        "texto": data.get("texto"), 
        "fecha": datetime.now(timezone.utc)
    }
    await db.diario.insert_one(entry)
    return {"status": "success"}

@app.get("/api/diario")
async def get_diario(user=Depends(get_current_user)):
    cursor = db.diario.find({"email": user["email"]}).sort("fecha", -1)
    entries = await cursor.to_list(length=10)
    return [{"id": str(e["_id"]), "date": e["fecha"].strftime("%d %b"), "text": e["texto"]} for e in entries]

# --- REPORTE MÉDICO ---

@app.get("/api/user/medical-report")
async def get_medical_report(user=Depends(get_current_user)):
    email = user["email"]
    glucosa_logs = await db.glucosa.find({"email": email}).sort("fecha", -1).to_list(50)
    ciclo_logs = await db.ciclos.find({"email": email}).sort("fecha_registro", -1).to_list(50)
    diario_logs = await db.diario.find({"email": email}).sort("fecha", -1).to_list(50)
    
    reporte = []
    for g in glucosa_logs:
        reporte.append({"tipo": "GLUCOSA", "valor": f"{g['valor']} mg/dL", "fecha": g["fecha"], "info": "Nivel de azúcar"})
        
    for c in ciclo_logs:
        sints = ", ".join(c.get("sintomas", [])) if c.get("sintomas") else "Sin síntomas"
        reporte.append({
            "tipo": "CICLO", 
            "valor": f"Ciclo de {c['duracion']} días", 
            "fecha": c["fecha_registro"], 
            "info": f"Inicio: {c['inicio'][:10]} | Síntomas: {sints}"
        })
        
    for d in diario_logs:
        reporte.append({"tipo": "DIARIO", "valor": "Reflexión", "fecha": d["fecha"], "info": d["texto"]})

    reporte.sort(key=lambda x: x['fecha'] if isinstance(x['fecha'], datetime) else datetime.fromisoformat(x['fecha'].replace('Z', '+00:00')), reverse=True)
    return reporte

# --- COMUNIDAD ---

@app.get("/api/chat/community/count")
async def get_community_count():
    return {"community_size": 161, "message_es": "161 mujeres cultivando bienestar"}

# --- INCLUSIÓN DE ROUTERS EXTERNOS ---
try:
    from routers.glucosa import router as glucosa_router
    app.include_router(glucosa_router, prefix="/api")
except ImportError:
    logger.warning("Router de glucosa no encontrado, saltando...")

if __name__ == "__main__":
    import uvicorn
    # 0.0.0.0 permite que otros dispositivos (como un móvil Android) se conecten
    uvicorn.run(app, host="0.0.0.0", port=8001)