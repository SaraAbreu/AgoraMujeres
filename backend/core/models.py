"""
Pydantic models for Ágora Mujeres API.

All models live here so routers can import them without circular deps.
"""

import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Diary ────────────────────────────────────────────────────────────────────

class EmotionalState(BaseModel):
    calma:         int = Field(default=0, ge=0, le=5)
    fatiga:        int = Field(default=0, ge=0, le=5)
    niebla_mental: int = Field(default=0, ge=0, le=5)
    dolor_difuso:  int = Field(default=0, ge=0, le=5)
    gratitud:      int = Field(default=0, ge=0, le=5)
    tension:       int = Field(default=0, ge=0, le=5)


class PhysicalState(BaseModel):
    nivel_dolor:  int = Field(default=0, ge=0, le=10)
    energia:      int = Field(default=0, ge=0, le=10)
    sensibilidad: int = Field(default=0, ge=0, le=10)


class DiaryEntry(BaseModel):
    id:             str            = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id:      str
    texto:          Optional[str]  = None
    emotional_state: EmotionalState = Field(default_factory=EmotionalState)
    physical_state: Optional[PhysicalState] = None
    weather:        Optional[Dict[str, Any]] = None
    created_at:     datetime       = Field(default_factory=datetime.utcnow)


class DiaryEntryCreate(BaseModel):
    device_id:      str
    texto:          Optional[str]  = None
    emotional_state: EmotionalState = Field(default_factory=EmotionalState)
    physical_state: Optional[PhysicalState] = None
    weather:        Optional[Dict[str, Any]] = None


# ── Chat ─────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    id:              str      = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id:       str
    conversation_id: str      = Field(default_factory=lambda: str(uuid.uuid4()))
    role:            str      # 'user' | 'assistant'
    content:         str
    created_at:      datetime = Field(default_factory=datetime.utcnow)


class ChatConversation(BaseModel):
    id:         str      = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id:  str
    title:      str      = "Nueva conversación"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    device_id:       str
    message:         str
    language:        str           = "es"   # "es" | "en"
    conversation_id: Optional[str] = None   # None → create new conversation


# ── Crisis ────────────────────────────────────────────────────────────────────

class CrisisRequest(BaseModel):
    device_id:  str
    pain_level: int            = Field(ge=1, le=10)
    language:   str            = "es"
    symptoms:   Optional[List[str]] = None


class FavoriteMessage(BaseModel):
    id:              str      = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id:       str
    message_content: str
    category:        str      = "general"
    created_at:      datetime = Field(default_factory=datetime.utcnow)


class MessageReaction(BaseModel):
    id:              str      = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id:       str
    conversation_id: str
    message_id:      str
    reaction:        str      # emoji: 💜 🙏 ✨
    created_at:      datetime = Field(default_factory=datetime.utcnow)


# ── Cycle ─────────────────────────────────────────────────────────────────────

class CycleEntry(BaseModel):
    id:         str           = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id:  str
    start_date: datetime
    end_date:   Optional[datetime] = None
    notes:      Optional[str]      = None
    created_at: datetime           = Field(default_factory=datetime.utcnow)


class CycleEntryCreate(BaseModel):
    device_id:  str
    start_date: datetime
    end_date:   Optional[datetime] = None
    notes:      Optional[str]      = None


# ── Subscriptions ─────────────────────────────────────────────────────────────

class SubscriptionStatus(BaseModel):
    device_id:          str
    stripe_customer_id: Optional[str] = None
    subscription_id:    Optional[str] = None
    status:             str           = "trial"   # trial | active | expired | cancelled
    trial_start:        datetime      = Field(default_factory=datetime.utcnow)
    trial_end:          datetime      = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(hours=2)
    )
    usage_seconds:      int           = 0
    created_at:         datetime      = Field(default_factory=datetime.utcnow)
    is_admin:           bool          = False


class CustomerCreate(BaseModel):
    device_id: str
    email:     str
    name:      Optional[str] = None


# ── Resources ─────────────────────────────────────────────────────────────────

class Resource(BaseModel):
    id:                 str           = Field(default_factory=lambda: str(uuid.uuid4()))
    category:           str           # breathing | stretching | nutrition | sleep | mindfulness | professional
    type:               str           # article | video
    title:              str
    description:        str
    content:            Optional[str] = None
    video_url:          Optional[str] = None
    thumbnail_url:      Optional[str] = None
    author:             Optional[str] = None
    author_credentials: Optional[str] = None
    duration:           Optional[str] = None
    read_time:          Optional[str] = None
    language:           str           = "es"
    is_featured:        bool          = False
    order:              int           = 0
    created_at:         datetime      = Field(default_factory=datetime.utcnow)


# ── Monthly pain record ───────────────────────────────────────────────────────

class MonthlyPainRecordCreate(BaseModel):
    records:          List[Dict[str, Any]] = Field(default_factory=list)
    cycle_start_date: str


# ── Admin ─────────────────────────────────────────────────────────────────────

class AdminCodeRequest(BaseModel):
    device_id: str
    code:      str
