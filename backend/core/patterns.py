"""
Pattern analysis helpers.

Previously duplicated word-for-word inside /chat and /diary/patterns.
Now lives in one place — both routers import from here.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from .database import db, db_find


# ── Public interface ──────────────────────────────────────────────────────────

async def get_patterns_for_device(
    device_id: str, days: int = 7
) -> Optional[Dict]:
    """
    Compute emotional & physical averages from diary entries.

    Returns None if there are no entries in the requested window.
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    entries = await db_find(
        db.diary_entries,
        {"device_id": device_id, "created_at": {"$gte": start_date}},
        limit=200,
    )

    if not entries:
        return None

    emotional_sums  = {k: 0 for k in ("calma", "fatiga", "niebla_mental", "dolor_difuso", "gratitud", "tension")}
    physical_sums   = {k: 0 for k in ("nivel_dolor", "energia", "sensibilidad")}
    physical_count  = 0

    for entry in entries:
        emotional = entry.get("emotional_state", {})
        for key in emotional_sums:
            emotional_sums[key] += emotional.get(key, 0)

        physical = entry.get("physical_state")
        if physical:
            physical_count += 1
            for key in physical_sums:
                physical_sums[key] += physical.get(key, 0)

    count = len(entries)
    emotional_avg = {k: round(v / count, 1) for k, v in emotional_sums.items()}
    physical_avg  = (
        {k: round(v / physical_count, 1) for k, v in physical_sums.items()}
        if physical_count > 0
        else None
    )

    # Word frequency in free-text entries
    word_counts: Dict[str, int] = {}
    for entry in entries:
        texto = entry.get("texto", "") or ""
        for word in texto.lower().split():
            if len(word) > 3:
                word_counts[word] = word_counts.get(word, 0) + 1

    common_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "period_days":       days,
        "total_entries":     count,
        "emotional_averages": emotional_avg,
        "physical_averages":  physical_avg,
        "common_words":       common_words,
        "trends": {
            "highest_emotional": max(emotional_avg, key=emotional_avg.get),
            "lowest_emotional":  min(emotional_avg, key=emotional_avg.get),
        },
    }


def build_patterns_context(patterns: Dict, language: str = "es") -> str:
    """
    Build the text snippet injected into the OpenAI system prompt
    so Ágora can reference the user's real patterns.
    """
    avg_pain     = patterns["physical_averages"].get("nivel_dolor", 0) if patterns["physical_averages"] else 0
    physical_avg = patterns["physical_averages"] or {}

    dolor_alto        = avg_pain > 6
    energia_baja      = physical_avg.get("energia", 10) < 4
    sensibilidad_alta = physical_avg.get("sensibilidad", 0) > 6
    count             = patterns["total_entries"]
    highest_emotion   = patterns["trends"]["highest_emotional"]
    lowest_emotion    = patterns["trends"]["lowest_emotional"]

    if language == "es":
        return (
            f"\n\nCONTEXTO DE PATRONES PERSONALIZADOS (últimos {patterns['period_days']} días):\n"
            f"- Total de registros: {count}\n"
            f"- Dolor promedio: {avg_pain}/10 {'⚠️ BASTANTE ALTO' if dolor_alto else ''}\n"
            f"- Energía promedio: {physical_avg.get('energia', 'N/A')}/10 {'⚠️ MUY BAJA' if energia_baja else ''}\n"
            f"- Sensibilidad promedio: {physical_avg.get('sensibilidad', 'N/A')}/10 {'⚠️ MUY ALTA' if sensibilidad_alta else ''}\n"
            f"- Emoción dominante: {highest_emotion}\n"
            f"- Emoción más baja: {lowest_emotion}\n\n"
            "INSTRUCCIONES ESPECIALES BASADAS EN PATRONES:\n"
            "1. Reconoce sus patrones específicamente en tu respuesta.\n"
            "2. Si energía < 4, sugiere SOLO movimientos en cama o sentada.\n"
            "3. Si dolor > 6, sugiere SOLO técnicas de respiración/relajación.\n"
            "4. Valida el esfuerzo: pequeños cambios en estas métricas significan mucho."
        )
    else:
        return (
            f"\n\nPERSONALIZED PATTERN CONTEXT (last {patterns['period_days']} days):\n"
            f"- Total entries: {count}\n"
            f"- Average pain: {avg_pain}/10 {'⚠️ QUITE HIGH' if dolor_alto else ''}\n"
            f"- Average energy: {physical_avg.get('energia', 'N/A')}/10 {'⚠️ VERY LOW' if energia_baja else ''}\n"
            f"- Average sensitivity: {physical_avg.get('sensibilidad', 'N/A')}/10 {'⚠️ VERY HIGH' if sensibilidad_alta else ''}\n"
            f"- Dominant emotion: {highest_emotion}\n"
            f"- Lowest emotion: {lowest_emotion}\n\n"
            "SPECIAL INSTRUCTIONS:\n"
            "1. Reference her specific patterns in your response.\n"
            "2. If energy < 4, suggest ONLY bed or seated movements.\n"
            "3. If pain > 6, suggest ONLY breathing/relaxation techniques.\n"
            "4. Validate effort: small changes in these numbers mean real work."
        )
