"""
Crisis router — instant support, bypasses OpenAI for speed.
"""

import logging
from datetime import datetime

from fastapi import APIRouter

from ..core.database import db, db_insert_one
from ..core.models import CrisisRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/crisis", tags=["crisis"])

CRISIS_RESPONSES = {
    "es": {
        "breathing": {
            "title": "🫁 Técnica 4-7-8 Calmante",
            "steps": [
                "Respira por la nariz contando hasta 4",
                "Sostén el aire durante 7",
                "Exhala por la boca contando hasta 8",
                "Repite 4 veces lentamente",
            ],
            "message": "Tu sistema nervioso necesita calmarse. Esta técnica es como bajar el volumen del dolor. Hazlo a tu ritmo.",
        },
        "grounding": {
            "title": "⚓ Anclarte en el Presente",
            "steps": [
                "5 cosas que ves",
                "4 que sientes en tu cuerpo",
                "3 sonidos que escuchas",
                "2 olores",
                "1 sabor",
            ],
            "message": "Tu mente se metió en el dolor. Traigámosla al presente. Mira a tu alrededor lentamente.",
        },
        "self_compassion": {
            "title": "💙 Autocompasión en el Dolor",
            "message": "Esto es difícil. Es comprensible que sufras. No estás sola. Hay personas que han pasado por esto y sobrevivieron. Tú también puedes.",
            "mantras": [
                "Este momento es difícil, pero pasará",
                "Mi cuerpo está luchando, y eso es valiente",
                "Merezco amabilidad, especialmente hoy",
            ],
        },
        "immediate": {
            "title": "🆘 En Este Momento",
            "message": "Estoy aquí. El dolor que sientes es real. Tu valor también es real. Aunque duela, estás segura.",
            "options": [
                "Necesito una técnica rápida",
                "Solo quiero que alguien escuche",
                "Estoy en emergencia - necesito contacto profesional",
            ],
        },
    },
    "en": {
        "breathing": {
            "title": "🫁 Calming 4-7-8 Technique",
            "steps": [
                "Breathe in through your nose, counting to 4",
                "Hold for a count of 7",
                "Exhale through your mouth, counting to 8",
                "Repeat 4 times slowly",
            ],
            "message": "Your nervous system needs to calm down. This technique is like turning down the volume on pain. Go at your pace.",
        },
        "grounding": {
            "title": "⚓ Grounding Yourself",
            "steps": [
                "5 things you see",
                "4 things you feel on your body",
                "3 sounds you hear",
                "2 smells",
                "1 taste",
            ],
            "message": "Your mind got stuck in the pain. Let's bring it to the present. Look around slowly.",
        },
        "self_compassion": {
            "title": "💙 Self-Compassion in Pain",
            "message": "This is hard. It makes sense that you're suffering. You're not alone. Others have experienced this and survived. You can too.",
            "mantras": [
                "This moment is difficult, but it will pass",
                "My body is fighting, and that is brave",
                "I deserve kindness, especially today",
            ],
        },
        "immediate": {
            "title": "🆘 Right Now",
            "message": "I'm here. The pain you feel is real. Your strength is also real. Even though it hurts, you are safe.",
            "options": [
                "I need a quick technique",
                "I just need someone to listen",
                "This is an emergency - I need professional help",
            ],
        },
    },
}

EMERGENCY_CONTACTS = {
    "es": {"spain": "024 (Teléfono de la Esperanza)", "general": "112 (Emergencias)"},
    "en": {"us": "988 (Suicide & Crisis Lifeline)", "uk": "116 123 (Samaritans)"},
}


@router.post("")
async def crisis_support(request: CrisisRequest):
    """
    Instant crisis support — bypasses OpenAI for ultra-fast response.
    Logs every request for analytics.
    """
    lang = request.language or "es"

    if request.pain_level >= 8:
        technique_key = "breathing" if "ansiedad" in (request.symptoms or []) else "grounding"
    else:
        technique_key = "self_compassion"

    technique = CRISIS_RESPONSES[lang].get(technique_key)
    immediate  = CRISIS_RESPONSES[lang].get("immediate")

    await db_insert_one(db.crisis_logs, {
        "device_id":        request.device_id,
        "pain_level":       request.pain_level,
        "symptoms":         request.symptoms or [],
        "technique_offered": technique_key,
        "created_at":       datetime.utcnow(),
    })

    return {
        "immediate":  immediate,
        "technique":  technique,
        "all_techniques": [
            {"key": k, **CRISIS_RESPONSES[lang][k]}
            for k in ("breathing", "grounding", "self_compassion")
        ],
        "emergency_contacts": EMERGENCY_CONTACTS,
    }
