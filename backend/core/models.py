import uuid
from datetime import datetime, timezone
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
    trial_remaining_seconds: int = 5400
    is_admin: bool = False
    trial_end: Optional[datetime] = None
    usage_seconds: int = 0
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