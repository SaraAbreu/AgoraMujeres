#!/usr/bin/env python3
"""
Ágora Mujeres - Lightweight Backend with OpenAI
"""

from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional, List
import os
import logging
from pathlib import Path
import uuid
from datetime import datetime
import json

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Verify OpenAI API key
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
if not OPENAI_API_KEY:
    logger.warning("⚠️ OPENAI_API_KEY not set in .env file")

# Create FastAPI app
app = FastAPI(
    title="Ágora Mujeres API",
    description="API for emotional companion app",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== MODELS ==============

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    role: str = "assistant"
    content: str
    timestamp: str

# ============== IN-MEMORY STORAGE ==============
conversations = {}

# ============== ROUTES ==============

@app.get("/api/")
async def root():
    return {
        "message": "Ágora Mujeres API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/health")
async def health():
    return {"status": "ok"}

@app.post("/api/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    """Send a message to Ágora and get a response."""
    
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key not configured"
        )
    
    try:
        import openai
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        # Convert messages to OpenAI format
        openai_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.messages
        ]
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_messages,
            max_tokens=500,
            temperature=0.7
        )
        
        assistant_message = response.choices[0].message.content
        
        return ChatResponse(
            role="assistant",
            content=assistant_message,
            timestamp=datetime.now().isoformat()
        )
    
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="OpenAI library not installed"
        )
    except Exception as e:
        logger.error(f"Error calling OpenAI: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing chat: {str(e)}"
        )

# ============== RUN ==============

if __name__ == "__main__":
    import uvicorn
    
    logger.info("🚀 Starting Ágora Mujeres Backend...")
    logger.info(f"📍 OpenAI configured: {'✅' if OPENAI_API_KEY else '❌'}")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
