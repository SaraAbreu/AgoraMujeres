import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

# ── DIARIO (MODELO UNIFICADO) ────────────────────────────────────────────────
class DiaryEntryCreate(BaseModel):
    device_id: str
    texto:     Optional[str] = None
    dolor:     int = Field(default=0, ge=0, le=10)
    # Estos son los términos exactos del backend
    cuerpo:    List[str] = Field(default_factory=list)
    mente:     List[str] = Field(default_factory=list)
    alma:      List[str] = Field(default_factory=list)
    suelto:    List[str] = Field(default_factory=list) 

class DiaryEntry(BaseModel):
    id:         str      = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id:  str
    texto:      Optional[str] = None
    dolor:      int
    cuerpo:    List[str] = Field(default_factory=list)
    mente:     List[str] = Field(default_factory=list)
    alma:      List[str] = Field(default_factory=list)
    suelto:    List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ── OTROS MODELOS (PARA QUE NO DE ERROR EL SERVER) ──────────────────────────
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    role: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubscriptionStatus(BaseModel):
    device_id: str
    status: str = "trial"
    trial_end: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=2))
    is_admin: bool = False

class AdminCodeRequest(BaseModel):
    device_id: str
    code: str

class CustomerCreate(BaseModel):
    device_id: str
    email: str
    name: Optional[str] = None

class Resource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: Optional[str] = None
    language: str = "es"

class MonthlyPainRecordCreate(BaseModel):
    records: List[Dict[str, Any]] = Field(default_factory=list)
    cycle_start_date: str