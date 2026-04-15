import random
import os
import logging
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# --- SISTEMA DE PROTECCIÓN SYNTEXIA (Rate Limiting) ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Inicializamos el limitador basado en la dirección IP del cliente
limiter = Limiter(key_func=get_remote_address)

# Importaciones de módulos internos de Syntexia
from core.models import ChatRequest, ChatMessage, ChatConversation, DiaryEntry, BodyMapEntry
from core.agora_content import SYSTEM_PROMPTS, get_smart_response, get_fallback_response, DAILY_CARDS
from core.llm_adapter import MyLLMInterface
from auth.dependencies import get_current_user

load_dotenv()

# Configuración de Logs de Grado Industrial - Sello Syntexia
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.FileHandler("syntexia_agora.log"),  # Auditoría persistente
        logging.StreamHandler()                    # Monitorización en tiempo real
    ]
)
logger = logging.getLogger("SyntexiaCore")

# Persistencia de Datos (MongoDB Atlas)
mongo_url = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'agoramujeres')

client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación y conexiones de red."""
    global client, db
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    logger.info("✅ Motor Syntexia: Conexión establecida con MongoDB")
    yield
    if client:
        client.close()
        logger.info("🛑 Motor Syntexia: Conexiones cerradas correctamente")

app = FastAPI(
    title="Ágora Mujeres API",
    description="""
    🚀 **Backend de alta precisión para el acompañamiento de salud femenina.**
    *Desarrollado por Syntexia.*
    
    Esta API orquesta la inteligencia emocional y física de Ágora, incluyendo:
    * 🧠 **IA con Memoria:** Acompañamiento personalizado basado en historial contextual.
    * 📈 **Análisis de Tendencias:** Motores de detección de patrones de bienestar.
    * 🎙️ **Diario de Voz:** Procesamiento de lenguaje natural y análisis de sentimientos.
    * 🛡️ **Privacidad Syntexia:** Protocolos de control total de datos y borrado seguro.
    """,
    version="2.0.1",
    contact={
        "name": "Syntexia Engineering Team",
        "url": "https://syntexia-solutions.com",
    },
    lifespan=lifespan
)

# --- INTEGRACIÓN DEL LIMITADOR EN LA APP ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- MIDDLEWARES DE SEGURIDAD Y ACCESO ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Inyección de cabeceras de seguridad para mitigar ataques XSS y Clickjacking."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Capturador global de errores de validación de datos (Input Sanitization)."""
    logger.error(f"⚠️ Fallo de validación de entrada: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": "Protocolo Syntexia: Los datos enviados no cumplen con el estándar de seguridad",
            "details": exc.errors()
        },
    )

# --- ENDPOINTS DE UTILIDADES Y SALUD DEL SISTEMA ---

@app.get("/api/health", tags=["System"])
@limiter.limit("20/minute")
async def health_check(request: Request):
    """Verifica la integridad del motor de Syntexia y su latencia con la base de datos."""
    try:
        await db.command("ping")
        return {
            "status": "online",
            "database": "connected",
            "engine": "Syntexia Core v2.0.1",
            "timestamp": datetime.now(timezone.utc)
        }
    except Exception as e:
        logger.critical(f"🚨 Error de sistema: {e}")
        return {"status": "degraded", "database": "disconnected"}

@app.get("/api/daily-card", tags=["Motivation"])
@limiter.limit("10/minute")
async def get_daily_card(request: Request, language: str = "es"):
    """Suministra una píldora de apoyo emocional aleatoria basada en el idioma del perfil."""
    cards = DAILY_CARDS.get(language, DAILY_CARDS["es"])
    return {
        "card": random.choice(cards),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }

# --- ENDPOINTS DE INTELIGENCIA DE SALUD ---

@app.get("/api/stats/summary", tags=["Health Intelligence"])
@limiter.limit("10/minute")
async def get_health_summary(request: Request, current_user: dict = Depends(get_current_user)):
    """Genera un reporte cuantitativo de la actividad de salud de la usuaria."""
    user_id = current_user["uid"]
    diary_count = await db.diary_entries.count_documents({"device_id": user_id})
    pain_points = await db.body_maps.count_documents({"device_id": user_id})
    
    return {
        "total_diary_entries": diary_count,
        "total_pain_points_registered": pain_points,
        "message": "Datos analizados correctamente."
    }

@app.get("/api/stats/trends", tags=["Health Intelligence"])
@limiter.limit("10/minute")
async def get_health_trends(request: Request, current_user: dict = Depends(get_current_user)):
    """Analiza patrones históricos de dolor para detectar tendencias de bienestar."""
    user_id = current_user["uid"]
    try:
        cursor = db.body_maps.find({"device_id": user_id}).sort("created_at", -1)
        recent_points = await cursor.to_list(length=30)
        
        if len(recent_points) < 3:
            return {"status": "info", "message": "Se requieren más registros para el análisis de tendencias."}

        intensities = [p["intensity"] for p in recent_points]
        avg_intensity = sum(intensities) / len(intensities)
        
        return {
            "status": "success",
            "average_intensity": round(avg_intensity, 1),
            "trend": "estable" if avg_intensity < 5 else "atención requerida",
            "message": "Sincronización de patrones completada."
        }
    except Exception as e:
        logger.error(f"Error en motor de tendencias: {e}")
        return {"status": "error", "message": "Análisis temporal no disponible."}

@app.get("/api/emergency/calm", tags=["Support"])
async def get_emergency_protocol(language: str = "es"):
    """Proporciona recursos de intervención inmediata en situaciones de crisis de dolor/ansiedad."""
    return {
        "technique": "4-7-8 Breathing",
        "audio_url": "https://storage.agora.com/calm_voice.mp3",
        "message": "Inicia el protocolo de calma guiada."
    }

# --- NÚCLEO DE COMUNICACIÓN E IA (Máxima Protección) ---

@app.post("/api/chat", tags=["AI Engine"])
@limiter.limit("5/minute")  # Muro Anti-Spam y ahorro de costes API
async def chat_with_agora(request_data: ChatRequest, request: Request, current_user: dict = Depends(get_current_user)):
    """Orquesta la conversación entre la usuaria y la IA, gestionando la memoria a corto plazo."""
    request_data.device_id = current_user["uid"]
    
    try:
        conversation_id = request_data.conversation_id
        is_first_message = not conversation_id
        
        if is_first_message:
            new_conv = ChatConversation(device_id=request_data.device_id)
            await db.chat_conversations.insert_one(new_conv.model_dump())
            conversation_id = new_conv.id
        
        # Recuperación de contexto histórico (últimos 10 mensajes)
        cursor = db.chat_messages.find({"conversation_id": conversation_id}).sort("created_at", 1).limit(10)
        prev_messages = await cursor.to_list(length=10)

        api_key = os.environ.get("OPENAI_API_KEY")
        system_prompt = SYSTEM_PROMPTS.get(request_data.language, SYSTEM_PROMPTS["es"])
        chat = MyLLMInterface(api_key=api_key, system_message=system_prompt)

        for msg in prev_messages:
            chat.add_message(msg["role"], msg["content"])

        response_data = await chat.generate_response(user_input=request_data.message)
        
        # Almacenamiento asíncrono de la interacción
        user_msg = ChatMessage(device_id=request_data.device_id, conversation_id=conversation_id, role="user", content=request_data.message)
        assistant_msg = ChatMessage(device_id=request_data.device_id, conversation_id=conversation_id, role="assistant", content=response_data["response"])

        await db.chat_messages.insert_many([user_msg.model_dump(), assistant_msg.model_dump()])

        return {
            "response": response_data["response"],
            "conversation_id": conversation_id,
            "is_offline_mode": response_data.get("is_offline_mode", False),
            "is_first_time": is_first_message
        }

    except Exception as e:
        logger.error(f"🛑 Error crítico en motor de IA: {e}")
        return {"response": get_fallback_response(request_data.language), "conversation_id": request_data.conversation_id}

# --- GESTIÓN DE REGISTROS Y PRIVACIDAD ---

@app.post("/api/diary", tags=["User Data"])
@limiter.limit("5/minute")
async def create_diary_entry(entry: DiaryEntry, request: Request, current_user: dict = Depends(get_current_user)):
    """Persiste una nueva entrada en el diario personal de la usuaria."""
    entry.device_id = current_user["uid"]
    await db.diary_entries.insert_one(entry.model_dump())
    return {"status": "success", "entry_id": entry.id}

@app.get("/api/diary", tags=["User Data"])
async def get_diary_entries(current_user: dict = Depends(get_current_user)):
    """Recupera el historial cronológico de entradas del diario."""
    cursor = db.diary_entries.find({"device_id": current_user["uid"]}).sort("created_at", -1)
    return await cursor.to_list(length=50)

@app.post("/api/body-map", tags=["User Data"])
@limiter.limit("10/minute")
async def save_body_pain(entry: BodyMapEntry, request: Request, current_user: dict = Depends(get_current_user)):
    """Registra una coordenada de dolor física en el mapa corporal dinámico."""
    entry.device_id = current_user["uid"]
    await db.body_maps.insert_one(entry.model_dump())
    return {"status": "success", "message": "Punto de dolor sincronizado"}

@app.post("/api/user/delete-account", tags=["Privacy"])
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Ejecuta el protocolo de borrado total de datos (Derecho al Olvido)."""
    uid = current_user["uid"]
    collections = ["chat_conversations", "chat_messages", "diary_entries", "body_maps", "subscriptions"]
    for col in collections:
        await db[col].delete_many({"device_id": uid})
    logger.info(f"🛡️ Privacidad: Usuario {uid} eliminado de todos los sistemas.")
    return {"status": "success", "message": "Datos eliminados permanentemente."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)