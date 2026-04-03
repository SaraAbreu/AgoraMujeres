import os
import uuid
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional

import fastapi
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from openai import OpenAI
from pydantic import BaseModel

# ── Routers ───────────────────────────────────────────────────────────────────
from routers.auth          import router as auth_router
from routers.diary         import router as diary_router
from routers.chat          import router as chat_router
from routers.crisis        import router as crisis_router
from routers.subscriptions import router as subscriptions_router
from routers.resources     import router as resources_router
from routers.misc          import router as misc_router
import auth.firebase_config

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
MONGO_URL       = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME         = os.environ.get("DB_NAME", "agora_db")
OPENAI_API_KEY  = os.environ.get("OPENAI_API_KEY")
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://agoramujeres.syntexia-solutions.es"
).split(",")

client        = None
db            = None
openai_client = None

# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    global client, db, openai_client

    client = AsyncIOMotorClient(MONGO_URL)
    db     = client[DB_NAME]
    logger.info("✅ MongoDB connected")

    if OPENAI_API_KEY and OPENAI_API_KEY.startswith("sk-"):
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        logger.info("✅ OpenAI initialized")
    else:
        openai_client = None
        logger.warning("⚠️ OpenAI key not configured")

    yield

    if client:
        client.close()

# ── App ───────────────────────────────────────────────────────────────────────
app = fastapi.FastAPI(lifespan=lifespan)

# CORS — siempre antes de los routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router,          prefix="/api")
app.include_router(diary_router,         prefix="/api")
app.include_router(chat_router,          prefix="/api")
app.include_router(crisis_router,        prefix="/api")
app.include_router(subscriptions_router, prefix="/api")
app.include_router(resources_router,     prefix="/api")
app.include_router(misc_router,          prefix="/api")

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    return {"status": "healthy"}

# ── Chat (endpoint inline, considera moverlo a routers/chat.py) ───────────────
class ChatRequest(BaseModel):
    device_id:       str
    message:         str
    conversation_id: Optional[str] = None
    language:        str           = "es"

def local_fallback(message: str) -> str:
    return "Ahora mismo estoy en modo offline. Vuelve a intentarlo en unos segundos."

@app.post("/api/chat")
async def chat(request: ChatRequest):
    global openai_client

    try:
        conversation_id = request.conversation_id or str(uuid.uuid4())
        user_profile    = await db.users.find_one({"device_id": request.device_id})

        if not user_profile:
            await db.users.insert_one({
                "device_id":  request.device_id,
                "name":       None,
                "created_at": datetime.utcnow(),
            })
            user_profile = {"name": None}

        user_name = user_profile.get("name")

        if not user_name:
            message_lower = request.message.lower()
            possible_name = None

            if "me llamo" in message_lower:
                possible_name = message_lower.split("me llamo")[-1].strip().split()[0]
            elif "soy" in message_lower:
                possible_name = message_lower.split("soy")[-1].strip().split()[0]
            elif "llámame" in message_lower:
                possible_name = message_lower.split("llámame")[-1].strip().split()[0]

            if possible_name:
                name = possible_name.capitalize()
                await db.users.update_one(
                    {"device_id": request.device_id},
                    {"$set": {"name": name}},
                )
                response_text = f"Encantada, {name}. Me alegra que estés aquí. ¿Cómo te sientes hoy?"
            else:
                response_text = "Hola, soy Ágora. Estoy aquí para acompañarte sin juicio y con calma. ¿Cómo te gustaría que te llame?"

            await db.messages.insert_one({
                "conversation_id": conversation_id,
                "role":            "assistant",
                "content":         response_text,
                "created_at":      datetime.utcnow(),
            })
            return {"response": response_text, "conversation_id": conversation_id}

        await db.messages.insert_one({
            "conversation_id": conversation_id,
            "role":            "user",
            "content":         request.message,
            "created_at":      datetime.utcnow(),
        })

        if openai_client:
            completion = openai_client.chat.completions.create(
                model    = "gpt-4o-mini",
                messages = [
                    {"role": "system", "content": f"Eres Ágora, una asistente emocional empática. El nombre de la usuaria es {user_name}. Úsalo con naturalidad."},
                    {"role": "user",   "content": request.message},
                ],
                temperature = 0.7,
                max_tokens  = 300,
            )
            response_text = completion.choices[0].message.content
        else:
            response_text = local_fallback(request.message)

        await db.messages.insert_one({
            "conversation_id": conversation_id,
            "role":            "assistant",
            "content":         response_text,
            "created_at":      datetime.utcnow(),
        })

        return {"response": response_text, "conversation_id": conversation_id}

    except Exception as e:
        logger.error(f"Chat error: {e}")
        return {
            "response":        "Ha ocurrido un error temporal.",
            "conversation_id": request.conversation_id or str(uuid.uuid4()),
        }