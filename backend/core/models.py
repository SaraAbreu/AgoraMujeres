import uuid
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

class DiaryEntryCreate(BaseModel):
    device_id: str
    texto: Optional[str] = None
    dolor: int = 0
    cuerpo: List[str] = []
    mente: List[str] = []
    alma: List[str] = []
    suelto: List[str] = []

class DiaryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    texto: Optional[str] = None
    dolor: int = 0
    cuerpo: List[str] = []
    mente: List[str] = []
    alma: List[str] = []
    suelto: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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

class MessageReaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    conversation_id: Optional[str] = None
    message_id: str
    reaction: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FavoriteMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    message_content: str
    category: str = "general"
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

    def __init__(self, **data):
        from datetime import datetime, timedelta
        if "trial_end" not in data or data["trial_end"] is None:
            data["trial_end"] = datetime.utcnow() + timedelta(seconds=data.get("trial_remaining_seconds", 5400))
        super().__init__(**data)

class CustomerCreate(BaseModel):
    device_id: str
    email: str
    name: Optional[str] = None

class AdminCodeRequest(BaseModel):
    device_id: str
    code: str
