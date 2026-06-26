import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    device_id: str
    message: str
    language: str = "es"
    conversation_id: Optional[str] = None

class ChatConversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    title: str = "Conversacion"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    conversation_id: Optional[str] = None
    role: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionStatus(BaseModel):
    device_id: str
    status: str = "trial"
    is_admin: bool = False
    trial_end: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=30)
    )
    usage_seconds: int = 0          # se mantiene para analytics, ya no controla el acceso
    stripe_customer_id: Optional[str] = None
    email: Optional[str] = None
    
class DiaryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    content: str
    emotion: Optional[str] = None
    pain_level: Optional[int] = None   # Escala 1-10
    voice_transcript: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BodyMapEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    zone: str           # ej: "lumbar", "cervical", "rodillas"
    intensity: int      # Escala 1-10
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GlucosaRegistro(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    valor: float
    fecha: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SintomaCronicoRegistro(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    sintomas: list[str]  # claves de síntomas
    zona: str           # zona seleccionada
    notas: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FavoriteMessage(BaseModel):
    device_id: str
    message_id: str
    content: Optional[str] = None


class MessageReaction(BaseModel):
    device_id: str
    message_id: str
    reaction: str


class AdminCodeRequest(BaseModel):
    code: str

class CustomerCreate(BaseModel):
    device_id: str
    email: Optional[str] = None
    name: Optional[str] = None

class DiaryEntryCreate(BaseModel):
    device_id: str
    body: Optional[str] = None
    mind: Optional[str] = None
    soul: Optional[str] = None
    free: Optional[str] = None
    mood: Optional[int] = None
    pain_level: Optional[int] = None

class CrisisRequest(BaseModel):
    device_id: str
    language: str = 'es'
    pain_level: int = 5
    symptoms: Optional[list] = None

class Resource(BaseModel):
    id: str = ''
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None

class MonthlyPainRecordCreate(BaseModel):
    device_id: str
    records: Optional[list] = None
    cycle_start_date: Optional[str] = None

class CycleEntryCreate(BaseModel):
    device_id: str
    start_date: str
    end_date: Optional[str] = None
    cycle_length: Optional[int] = None
    period_length: Optional[int] = None
    notes: Optional[str] = None

class CycleEntry(CycleEntryCreate):
    id: str = ''
    created_at: Optional[str] = None

class DailyCheckIn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    pain_level: int                        # 1-5
    zonas: List[str] = []                  # lumbar, cabeza, articulaciones, abdomen, general
    sintomas: List[str] = []               # fatiga, niebla_mental, nauseas, inflamacion
    fase_ciclo: Optional[str] = None       # fase en el momento del registro
    dia_ciclo: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DailyCheckInCreate(BaseModel):
    device_id: str
    pain_level: int
    zonas: List[str] = []
    sintomas: List[str] = []
    fase_ciclo: Optional[str] = None
    dia_ciclo: Optional[int] = None
