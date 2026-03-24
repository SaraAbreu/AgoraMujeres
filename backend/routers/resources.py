"""
Resources router — articles, videos, and categories about fibromyalgia.
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException

from ..core.database import db, db_aggregate, db_delete_many, db_find, db_insert_many, db_insert_one
from ..core.models import Resource

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/resources", tags=["resources"])

CATEGORY_META = {
    "breathing":    {"name_es": "Respiraciones",        "name_en": "Breathing",         "icon": "leaf"},
    "stretching":   {"name_es": "Estiramientos",        "name_en": "Stretching",        "icon": "body"},
    "nutrition":    {"name_es": "Nutrición",            "name_en": "Nutrition",         "icon": "nutrition"},
    "sleep":        {"name_es": "Sueño",                "name_en": "Sleep",             "icon": "moon"},
    "mindfulness":  {"name_es": "Mindfulness",          "name_en": "Mindfulness",       "icon": "flower"},
    "professional": {"name_es": "Consejos profesionales", "name_en": "Professional advice", "icon": "medkit"},
}


@router.get("")
async def get_resources(category: Optional[str] = None, language: str = "es", limit: int = 50):
    query: dict = {"language": language}
    if category:
        query["category"] = category

    resources = await db_find(
        db.resources,
        query,
        sort=("is_featured", -1),
        limit=limit,
    )

    if not resources:
        demo = _demo_resources(language)
        if category:
            demo = [r for r in demo if r["category"] == category]
        return demo[:limit]

    return [_serialize(r) for r in resources]


@router.get("/categories")
async def get_resource_categories(language: str = "es"):
    pipeline = [
        {"$match": {"language": language}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    result = await db_aggregate(db.resources, pipeline)

    if not result:
        # Fallback when DB is empty
        return [
            {
                "id":    cat_id,
                "name":  meta.get(f"name_{language}", cat_id),
                "icon":  meta["icon"],
                "count": 0,
            }
            for cat_id, meta in CATEGORY_META.items()
        ]

    return [
        {
            "id":    cat["_id"],
            "name":  CATEGORY_META.get(cat["_id"], {}).get(f"name_{language}", cat["_id"]),
            "icon":  CATEGORY_META.get(cat["_id"], {}).get("icon", "document"),
            "count": cat["count"],
        }
        for cat in result
    ]


@router.post("")
async def create_resource(resource: Resource):
    await db_insert_one(db.resources, resource.model_dump())
    return {"success": True, "id": resource.id}


@router.post("/seed")
async def seed_resources():
    """Seed initial resources (deletes existing ones first)."""
    await db_delete_many(db.resources, {})
    resources = _seed_data()
    await db_insert_many(db.resources, resources)
    return {"message": "Resources seeded", "count": len(resources)}


# ── Serialization ─────────────────────────────────────────────────────────────

def _serialize(r: dict) -> dict:
    return {
        "id":                 r["id"],
        "category":           r["category"],
        "type":               r["type"],
        "title":              r["title"],
        "description":        r["description"],
        "content":            r.get("content"),
        "video_url":          r.get("video_url"),
        "thumbnail_url":      r.get("thumbnail_url"),
        "author":             r.get("author"),
        "author_credentials": r.get("author_credentials"),
        "duration":           r.get("duration"),
        "read_time":          r.get("read_time"),
        "is_featured":        r.get("is_featured", False),
    }


# ── Demo / seed data ──────────────────────────────────────────────────────────

def _demo_resources(language: str) -> list:
    if language == "es":
        return [
            {"id": "1", "category": "breathing",   "type": "video",   "title": "Respiración abdominal para el dolor",       "description": "Técnica sencilla de 5 minutos para calmar el dolor",         "video_url": "https://www.youtube.com/watch?v=example",  "duration": "5 min",  "author": "Dra. María López",           "is_featured": True},
            {"id": "2", "category": "stretching",  "type": "article", "title": "Estiramientos suaves para fibromialgia",     "description": "Guía de 10 estiramientos que puedes hacer sin agravar el dolor", "content": "Los estiramientos pueden mejorar la flexibilidad...", "read_time": "8 min", "author": "Fisioterapeuta Juan García", "is_featured": True},
            {"id": "3", "category": "nutrition",   "type": "article", "title": "Alimentos antiinflamatorios para fibromialgia", "description": "Lista de alimentos que ayudan a reducir la inflamación",     "content": "Una dieta antiinflamatoria puede mejorar los síntomas...", "read_time": "10 min", "author": "Nutricionista Ana Rodríguez", "is_featured": True},
            {"id": "4", "category": "sleep",       "type": "video",   "title": "Rutina nocturna de 10 minutos",              "description": "Prepara tu cuerpo para dormir mejor",                         "video_url": "https://www.youtube.com/watch?v=example2", "duration": "10 min", "author": "Coach de sueño",             "is_featured": False},
            {"id": "5", "category": "mindfulness", "type": "article", "title": "Meditación guiada para el dolor crónico",    "description": "Cómo usar mindfulness para cambiar tu relación con el dolor",  "content": "La meditación mindfulness ha demostrado reducir la percepción del dolor...", "read_time": "7 min", "author": "Psicóloga Clínica", "is_featured": False},
            {"id": "6", "category": "professional","type": "article", "title": "Qué esperar en una consulta con especialista", "description": "Guía para prepararte para tu próxima cita médica",          "content": "Una buena comunicación con tu médico es clave...", "read_time": "6 min", "author": "Dra. Especialista en Fibromialgia", "is_featured": False},
        ]
    return [
        {"id": "1", "category": "breathing",   "type": "video",   "title": "Abdominal breathing for pain relief",          "description": "Simple 5-minute technique to calm pain",        "video_url": "https://www.youtube.com/watch?v=example",  "duration": "5 min",  "author": "Dr. John Smith",        "is_featured": True},
        {"id": "2", "category": "stretching",  "type": "article", "title": "Gentle stretches for fibromyalgia",            "description": "10 stretches you can do without worsening pain", "content": "Stretching can improve flexibility...",        "read_time": "8 min",  "author": "PT James Wilson",       "is_featured": True},
        {"id": "3", "category": "nutrition",   "type": "article", "title": "Anti-inflammatory foods for fibromyalgia",     "description": "Foods that help reduce inflammation",           "content": "An anti-inflammatory diet can improve symptoms...", "read_time": "10 min", "author": "Sarah Brown, RD",   "is_featured": True},
        {"id": "4", "category": "sleep",       "type": "video",   "title": "10-minute bedtime routine",                    "description": "Prepare your body for better sleep",            "video_url": "https://www.youtube.com/watch?v=example2", "duration": "10 min", "author": "Sleep Coach",           "is_featured": False},
        {"id": "5", "category": "mindfulness", "type": "article", "title": "Guided meditation for chronic pain",           "description": "Use mindfulness to change your relationship with pain", "content": "Mindfulness meditation reduces pain perception...", "read_time": "7 min", "author": "Clinical Psychologist", "is_featured": False},
        {"id": "6", "category": "professional","type": "article", "title": "What to expect at a specialist appointment",  "description": "Prepare for your next medical visit",          "content": "Good communication with your doctor is key...", "read_time": "6 min", "author": "Fibromyalgia Specialist MD", "is_featured": False},
    ]


def _seed_data() -> list:
    import uuid as _uuid
    now = datetime.utcnow()
    return [
        {"id": str(_uuid.uuid4()), "category": "breathing",   "type": "video",  "title": "Respiración diafragmática para el dolor",    "description": "Técnica de respiración profunda que calma el sistema nervioso.", "video_url": "https://www.youtube.com/watch?v=YRPh_GaiL8s", "thumbnail_url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400", "author": "Fisioterapia Online", "author_credentials": "Fisioterapeutas especializados", "duration": "5:42", "language": "es", "is_featured": True,  "order": 1, "created_at": now},
        {"id": str(_uuid.uuid4()), "category": "stretching",  "type": "video",  "title": "Estiramientos suaves para fibromialgia",      "description": "Rutina diseñada específicamente para personas con fibromialgia.",  "video_url": "https://www.youtube.com/watch?v=4pKly2JojMw", "thumbnail_url": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", "author": "Fibromialgia Noticias", "author_credentials": "Especialistas en fibromialgia",  "duration": "15:30","language": "es", "is_featured": True,  "order": 2, "created_at": now},
        {"id": str(_uuid.uuid4()), "category": "mindfulness", "type": "video",  "title": "Meditación guiada para el dolor crónico",     "description": "Meditación de 10 minutos para gestionar el dolor con mindfulness.", "video_url": "https://www.youtube.com/watch?v=inpok4MKVLM","thumbnail_url": "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400","author": "Mindfulness España", "author_credentials": "Instructores certificados",       "duration": "10:00","language": "es", "is_featured": False, "order": 3, "created_at": now},
        {"id": str(_uuid.uuid4()), "category": "sleep",       "type": "video",  "title": "Técnicas para mejorar el sueño",             "description": "Consejos para mejorar la calidad del sueño con dolor crónico.",   "video_url": "https://www.youtube.com/watch?v=t0kACis_dJE", "thumbnail_url": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400", "author": "Salud y Bienestar", "author_credentials": "Especialistas en trastornos del sueño","duration": "8:15", "language": "es", "is_featured": False, "order": 4, "created_at": now},
        {"id": str(_uuid.uuid4()), "category": "professional","type": "video",  "title": "¿Qué es la fibromialgia? Explicación médica", "description": "Un médico explica fibromialgia, síntomas y opciones de tratamiento.", "video_url": "https://www.youtube.com/watch?v=_4Vt88jIKAs","thumbnail_url": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400","author": "Dr. Medical",       "author_credentials": "Reumatólogo",                    "duration": "12:45","language": "es", "is_featured": False, "order": 5, "created_at": now},
        {"id": str(_uuid.uuid4()), "category": "nutrition",   "type": "video",  "title": "Alimentación antiinflamatoria",               "description": "Alimentos que ayudan a reducir la inflamación en fibromialgia.",   "video_url": "https://www.youtube.com/watch?v=Yv1v7-RFnNE", "thumbnail_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400", "author": "Nutrición Consciente","author_credentials": "Nutricionistas especializados",  "duration": "11:20","language": "es", "is_featured": False, "order": 6, "created_at": now},
    ]
