"""
Chat router — Ágora conversation endpoints.
"""

import logging
import os
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..core.agora_content import (
    SYSTEM_PROMPTS,
    get_fallback_response,
    get_smart_response,
)
from ..core.database import db, db_count_documents, db_find, db_find_one, db_insert_one, db_update_one
from ..core.models import ChatConversation, ChatMessage, ChatRequest, FavoriteMessage, MessageReaction
from ..core.patterns import build_patterns_context, get_patterns_for_device
from .subscriptions import get_subscription_status_internal, track_usage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


# ── Main chat endpoint ────────────────────────────────────────────────────────

@router.post("")
async def chat_with_agora(request: ChatRequest):
    """Send a message to Ágora and receive a response."""
    # 1. Subscription gate
    sub_status = await get_subscription_status_internal(request.device_id)
    if sub_status["status"] == "expired":
        msg = (
            "Tu período de prueba ha terminado. Para continuar usando Ágora, activa tu suscripción."
            if request.language == "es"
            else "Your trial period has ended. To continue using Ágora, activate your subscription."
        )
        return {"response": msg, "requires_subscription": True}

    # 2. Is this the user's very first message?
    user_message_count = await db_count_documents(
        db.chat_messages, {"device_id": request.device_id, "role": "user"}
    )
    is_first_message = user_message_count == 0

    # 3. Get or create conversation
    conversation_id = request.conversation_id
    if not conversation_id:
        new_conv = ChatConversation(
            device_id=request.device_id,
            title=request.message[:50] + ("..." if len(request.message) > 50 else ""),
        )
        await db_insert_one(db.chat_conversations, new_conv.model_dump())
        conversation_id = new_conv.id
    else:
        await db_update_one(
            db.chat_conversations,
            {"id": conversation_id},
            {"$set": {"updated_at": datetime.utcnow()}},
        )

    # 4. Load last 8 messages from this conversation (context window)
    history = await db_find(
        db.chat_messages,
        {"device_id": request.device_id, "conversation_id": conversation_id},
        sort=("created_at", -1),
        limit=8,
    )
    history = list(reversed(history))

    # 5. Build response
    response, is_offline_mode = await _generate_response(
        request, history, is_first_message, conversation_id
    )

    # 6. Persist both messages
    await db_insert_one(
        db.chat_messages,
        ChatMessage(device_id=request.device_id, conversation_id=conversation_id,
                    role="user", content=request.message).model_dump(),
    )
    await db_insert_one(
        db.chat_messages,
        ChatMessage(device_id=request.device_id, conversation_id=conversation_id,
                    role="assistant", content=response).model_dump(),
    )

    # 7. Track trial usage (30 s per chat exchange)
    await track_usage(request.device_id, 30)

    return {
        "response":             response,
        "conversation_id":      conversation_id,
        "requires_subscription": False,
        "is_first_time":        is_first_message,
        "is_offline_mode":      is_offline_mode,
    }


async def _generate_response(
    request: ChatRequest,
    history: list,
    is_first_message: bool,
    conversation_id: str,
) -> tuple[str, bool]:
    """
    Try OpenAI first; fall back to smart local responses if unavailable.
    Returns (response_text, is_offline_mode).
    """
    api_key = os.environ.get("OPENAI_API_KEY", "")
    use_openai = bool(api_key.strip() and api_key != "sk-your-openai-api-key-here")

    if not use_openai:
        return get_smart_response(request.message, request.language, is_first_message), True


    try:
        from openai import AsyncOpenAI
        client_openai = AsyncOpenAI(api_key=api_key)

        system_prompt = SYSTEM_PROMPTS.get(request.language, SYSTEM_PROMPTS["es"])

        # Enriquecer con patrones del diario y ejemplos recientes
        try:
            patterns = await get_patterns_for_device(request.device_id, days=7)
            if patterns:
                system_prompt += build_patterns_context(patterns, request.language)
                # Resumen de tendencias emocionales y cambios recientes
                highest = patterns["trends"]["highest_emotional"]
                lowest = patterns["trends"]["lowest_emotional"]
                system_prompt += (
                    f"\nTENDENCIAS EMOCIONALES: La emoción más frecuente últimamente es '{highest}', y la menos presente es '{lowest}'. "
                    "Si detectas un cambio reciente en el estado emocional, destácalo y valida ese esfuerzo."
                )
        except Exception as e:
            logger.warning(f"Pattern enrichment failed (non-fatal): {e}")

        # Enriquecer con ejemplos reales del diario y síntomas
        try:
            from ..core.database import db_find
            diary_entries = await db_find(
                db.diary_entries,
                {"device_id": request.device_id},
                sort=("created_at", -1),
                limit=5,
            )
            diary_examples = []
            symptoms = set()
            SYMPTOM_KEYWORDS = [
                "fibromialgia", "artritis", "migraña", "endometriosis", "SFC", "POTS", "dolor", "fatiga", "insomnio", "ansiedad", "depresión", "cansancio", "crisis", "contractura", "espalda", "pierna", "cabeza", "hormigueo", "mareo", "náusea", "sueño", "estrés"
            ]
            for entry in diary_entries:
                texto = (entry.get("texto") or "").strip()
                if texto:
                    diary_examples.append(texto)
                    for word in SYMPTOM_KEYWORDS:
                        if word in texto.lower():
                            symptoms.add(word)
            if diary_examples:
                system_prompt += f"\n\nEJEMPLOS RECIENTES DEL DIARIO (útiles para personalizar la respuesta):\n"
                for ex in diary_examples[:3]:
                    system_prompt += f"- \"{ex}\"\n"
            if symptoms:
                system_prompt += f"\nSÍNTOMAS/ENFERMEDADES MENCIONADOS EN EL DIARIO:\n- {', '.join(sorted(symptoms))}\n"
        except Exception as e:
            logger.warning(f"Diary enrichment failed (non-fatal): {e}")

        # Instrucción explícita para la IA
        system_prompt += (
            "\nINSTRUCCIONES ESPECIALES:\n"
            "- Relaciona tus respuestas y sugerencias con los síntomas, emociones, tendencias y logros que aparecen en el diario y el chat.\n"
            "- Si sugieres ejercicios o alimentación, personalízalos según los síntomas, tendencias y cambios recientes, y recuerda siempre que no eres médico.\n"
            "- Si detectas una mejora o esfuerzo reciente, valídalo y celébralo explícitamente.\n"
            "- Nunca repitas tu presentación si ya hay historial.\n"
        )

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": request.message})

        reply = await client_openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=300,
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


@router.delete("/{device_id}/conversation/{conversation_id}")
async def delete_conversation(device_id: str, conversation_id: str):
    from ..core.database import db_delete_many, db_delete_one
    await db_delete_one(db.chat_conversations, {"id": conversation_id, "device_id": device_id})
    result = await db_delete_many(db.chat_messages, {"conversation_id": conversation_id, "device_id": device_id})
    return {"message": "Conversation deleted", "deleted_messages": result.deleted_count}


@router.get("/{device_id}/history")
async def get_chat_history(device_id: str, limit: int = 50):
    """Legacy endpoint — returns messages from the most recent conversation."""
    latest = await db_find_one(
        db.chat_conversations,
        {"device_id": device_id},
    )
    # db_find_one doesn't support sort — get all and pick latest
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
    from ..core.database import db_delete_many, db_delete_one
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
    reactions = await db_find(db.message_reactions, {"device_id": device_id, "message_id": message_id})
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
    from ..core.database import db_delete_one
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


# ── Helpers ───────────────────────────────────────────────────────────────────

def _iso(value) -> Optional[str]:
    if isinstance(value, datetime):
        return value.isoformat()
    return value
