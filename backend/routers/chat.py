"""
Chat router — Ágora conversation endpoints.
"""

import logging
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env", override=True)
load_dotenv(override=False)  # fallback: CWD

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from core.agora_content import (
    SYSTEM_PROMPTS,
    get_fallback_response,
    get_smart_response,
)
# BUG CORREGIDO: db_delete_many y db_delete_one añadidos al import top-level
# (antes se importaban dentro de funciones con `from ..core.database import ...`
# lo que lanzaba ImportError: attempted relative import beyond top-level package)
from core.database import (
    db,
    db_count_documents,
    db_delete_many,
    db_delete_one,
    db_find,
    db_find_one,
    db_insert_one,
    db_update_one,
)
from core.models import ChatConversation, ChatMessage, ChatRequest, FavoriteMessage, MessageReaction
from core.patterns import build_patterns_context, get_patterns_for_device
# BUG CORREGIDO: import absoluto en lugar de relativo (.subscriptions)
from routers.subscriptions import get_subscription_status_internal, track_usage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


# ── Main chat endpoint ────────────────────────────────────────────────────────

@router.post("")
async def chat_with_agora(request: ChatRequest):
    """Send a message to Ágora and receive a response."""

    # 1. Subscription gate
    # BUG CORREGIDO: sub_status["status"] explotaba si get_subscription_status_internal
    # devolvía None (cuando la DB aún no estaba lista o el device_id era nuevo).
    # Ahora tiene try/except y valor por defecto seguro.
    try:
        sub_status = await get_subscription_status_internal(request.device_id)
        if sub_status is None:
            sub_status = {"status": "active"}
    except Exception as e:
        logger.warning(f"Subscription check failed (non-fatal): {e}")
        sub_status = {"status": "active"}

    if sub_status.get("status") == "expired":
        msg = (
            "Tu período de prueba ha terminado. Para continuar usando Ágora, activa tu suscripción."
            if request.language == "es"
            else "Your trial period has ended. To continue using Ágora, activate your subscription."
        )
        return {"response": msg, "requires_subscription": True}

    # 2. ¿Es el primer mensaje de la usuaria?
    try:
        user_message_count = await db_count_documents(
            db.chat_messages, {"device_id": request.device_id, "role": "user"}
        )
    except Exception:
        user_message_count = 1  # fallback: no tratar como primer mensaje
    is_first_message = user_message_count == 0

    # 3. Obtener o crear conversación
    conversation_id = request.conversation_id
    if not conversation_id:
        temp_title = request.message[:50] + ("..." if len(request.message) > 50 else "")
        new_conv = ChatConversation(device_id=request.device_id, title=temp_title)
        await db_insert_one(db.chat_conversations, new_conv.model_dump())
        conversation_id = new_conv.id

        try:
            smart_title = await _generate_conversation_title(request.message, request.language)
            if smart_title:
                await db_update_one(
                    db.chat_conversations,
                    {"id": conversation_id},
                    {"$set": {"title": smart_title}},
                )
        except Exception as e:
            logger.warning(f"Smart title generation failed (non-fatal): {e}")
    else:
        await db_update_one(
            db.chat_conversations,
            {"id": conversation_id},
            {"$set": {"updated_at": datetime.now(timezone.utc)}},
        )

    # 4. Cargar últimos 8 mensajes de contexto
    history = await db_find(
        db.chat_messages,
        {"device_id": request.device_id, "conversation_id": conversation_id},
        sort=("created_at", -1),
        limit=8,
    )
    history = list(reversed(history))

    # 5. Generar respuesta
    response, is_offline_mode = await _generate_response(
        request, history, is_first_message, conversation_id
    )

    # 6. Persistir ambos mensajes
    await db_insert_one(
        db.chat_messages,
        ChatMessage(
            device_id=request.device_id,
            conversation_id=conversation_id,
            role="user",
            content=request.message,
        ).model_dump(),
    )
    await db_insert_one(
        db.chat_messages,
        ChatMessage(
            device_id=request.device_id,
            conversation_id=conversation_id,
            role="assistant",
            content=response,
        ).model_dump(),
    )

    # 7. Registrar uso del trial
    try:
        await track_usage(request.device_id, 30)
    except Exception as e:
        logger.warning(f"track_usage failed (non-fatal): {e}")

    return {
        "response":              response,
        "conversation_id":       conversation_id,
        "requires_subscription": False,
        "is_first_time":         is_first_message,
        "is_offline_mode":       is_offline_mode,
    }


async def _generate_response(
    request: ChatRequest,
    history: list,
    is_first_message: bool,
    conversation_id: str,
) -> tuple[str, bool]:
    """
    Intenta OpenAI primero; cae a respuestas locales si no está disponible.
    Retorna (texto_respuesta, is_offline_mode).
    """
    api_key  = os.environ.get("OPENAI_API_KEY", "")
    use_openai = bool(api_key.strip() and api_key != "sk-your-openai-api-key-here")
    logger.debug("[CHAT] use_openai=%s", use_openai)

    if not use_openai:
        return get_smart_response(request.message, request.language, is_first_message), True

    try:
        from openai import AsyncOpenAI
        client_openai = AsyncOpenAI(api_key=api_key)

        system_prompt = SYSTEM_PROMPTS.get(request.language, SYSTEM_PROMPTS["es"])

        # Enriquecer con patrones del diario
        try:
            patterns = await get_patterns_for_device(request.device_id, days=7)
            if patterns:
                system_prompt += build_patterns_context(patterns, request.language)
        except Exception as e:
            logger.warning(f"Pattern enrichment failed (non-fatal): {e}")

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": request.message})

        reply = await client_openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
        )
        return reply.choices[0].message.content, False

    except Exception as e:
        logger.warning(f"OpenAI unavailable, using offline mode: {e}")
        return get_smart_response(request.message, request.language, is_first_message), True


# ── Conversation management ───────────────────────────────────────────────────

@router.get("/{device_id}/conversations")
async def get_conversations(device_id: str, limit: int = 20):
    conversations = await db_find(
        db.chat_conversations,
        {"device_id": device_id},
        sort=("updated_at", -1),
        limit=limit,
    )
    return [
        {
            "id":         c["id"],
            "title":      c.get("title", "Conversación"),
            "created_at": _iso(c.get("created_at")),
            "updated_at": _iso(c.get("updated_at")),
        }
        for c in conversations
    ]


@router.get("/{device_id}/conversation/{conversation_id}")
async def get_conversation_messages(device_id: str, conversation_id: str, limit: int = 50):
    messages = await db_find(
        db.chat_messages,
        {"device_id": device_id, "conversation_id": conversation_id},
        sort=("created_at", 1),
        limit=limit,
    )
    return [
        {"role": m["role"], "content": m["content"], "created_at": _iso(m.get("created_at"))}
        for m in messages
    ]


# BUG CORREGIDO: endpoint `delete_conversation` estaba definido DOS VECES.
# FastAPI registraba solo la segunda (vacía, con try/except sin lógica real).
# Se deja una sola versión con la lógica correcta.
@router.delete("/{device_id}/conversation/{conversation_id}")
async def delete_conversation(device_id: str, conversation_id: str):
    await db_delete_one(db.chat_conversations, {"id": conversation_id, "device_id": device_id})
    result = await db_delete_many(
        db.chat_messages, {"conversation_id": conversation_id, "device_id": device_id}
    )
    return {"message": "Conversation deleted", "deleted_messages": result.deleted_count}


@router.get("/{device_id}/history")
async def get_chat_history(device_id: str, limit: int = 50):
    """Endpoint legacy — devuelve mensajes de la conversación más reciente."""
    # BUG CORREGIDO: se eliminó la llamada `latest = await db_find_one(...)` que
    # era código muerto (resultado nunca usado) justo antes del db_find equivalente.
    convs = await db_find(
        db.chat_conversations, {"device_id": device_id}, sort=("updated_at", -1), limit=1
    )
    if convs:
        messages = await db_find(
            db.chat_messages,
            {"device_id": device_id, "conversation_id": convs[0]["id"]},
            sort=("created_at", 1),
            limit=limit,
        )
    else:
        messages = await db_find(
            db.chat_messages,
            {"device_id": device_id},
            sort=("created_at", -1),
            limit=limit,
        )
        messages = list(reversed(messages))

    return [
        {
            "role":            m["role"],
            "content":         m["content"],
            "created_at":      _iso(m.get("created_at")),
            "conversation_id": m.get("conversation_id"),
        }
        for m in messages
    ]


@router.delete("/{device_id}/history")
async def clear_chat_history(device_id: str):
    convs = await db_find(
        db.chat_conversations, {"device_id": device_id}, sort=("updated_at", -1), limit=1
    )
    if convs:
        await db_delete_one(db.chat_conversations, {"id": convs[0]["id"]})
        result = await db_delete_many(db.chat_messages, {"conversation_id": convs[0]["id"]})
        return {"message": "Conversation cleared", "deleted_count": result.deleted_count}
    return {"message": "No conversation to clear", "deleted_count": 0}


# ── Reactions ─────────────────────────────────────────────────────────────────

@router.post("/reaction")
async def save_message_reaction(reaction: MessageReaction):
    existing = await db_find_one(db.message_reactions, {
        "device_id":  reaction.device_id,
        "message_id": reaction.message_id,
        "reaction":   reaction.reaction,
    })
    if not existing:
        await db_insert_one(db.message_reactions, reaction.model_dump())
    return {"status": "saved", "reaction_id": reaction.id}


@router.get("/{device_id}/reaction/{message_id}")
async def get_message_reactions(device_id: str, message_id: str):
    reactions = await db_find(
        db.message_reactions, {"device_id": device_id, "message_id": message_id}
    )
    counts: dict = {}
    for r in reactions:
        emoji = r.get("reaction", "")
        counts[emoji] = counts.get(emoji, 0) + 1
    return {"reactions": counts}


# ── Favorites ─────────────────────────────────────────────────────────────────

@router.post("/favorites")
async def save_favorite(msg: FavoriteMessage):
    await db_insert_one(db.favorite_messages, msg.model_dump())
    return {"id": msg.id, "status": "saved"}


@router.get("/favorites/{device_id}")
async def get_favorites(device_id: str, category: Optional[str] = None):
    query = {"device_id": device_id}
    if category:
        query["category"] = category
    messages = await db_find(db.favorite_messages, query, sort=("created_at", -1))
    return [
        {
            "id":         m["id"],
            "content":    m["message_content"],
            "category":   m.get("category", "general"),
            "created_at": _iso(m.get("created_at")),
        }
        for m in messages
    ]


@router.delete("/favorites/{device_id}/{message_id}")
async def delete_favorite(device_id: str, message_id: str):
    result = await db_delete_one(db.favorite_messages, {"id": message_id, "device_id": device_id})
    return {"deleted": result.deleted_count > 0}


# ── Community count ───────────────────────────────────────────────────────────

@router.get("/community/count")
async def get_community_count():
    try:
        if hasattr(db.chat_messages, "distinct"):
            unique = await db.chat_messages.distinct("device_id")
            count = len(unique)
        else:
            count = 0
    except Exception:
        count = 0
    return {
        "community_size": count,
        "message_es": f"Eres parte de una comunidad de {count} mujeres que entienden fibromialgia 💜",
        "message_en": f"You're part of a community of {count} women who understand fibromyalgia 💜",
    }


# ── Título inteligente ────────────────────────────────────────────────────────

async def _generate_conversation_title(first_message: str, lang: str) -> Optional[str]:
    """Genera un título corto con OpenAI basado en el primer mensaje."""
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key or len(first_message) < 10:
        return None
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)
        prompt = (
            f"Basado en este mensaje de una usuaria: '{first_message}', "
            f"genera un título de máximo 4 palabras que resuma el tema. "
            f"Responde SOLO con el título, sin comillas ni puntos finales. Idioma: {lang}"
        )
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=20,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _iso(value) -> Optional[str]:
    if isinstance(value, datetime):
        return value.isoformat()
    return value