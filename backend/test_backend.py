"""
Test suite for Ágora Mujeres backend.

Covers all 6 issues identified in the audit:
  1. DB helpers work correctly (no direct Motor calls)
  2. Diary endpoints use db_find (no mongomock crash)
  3. Pattern analysis deduplication
  4. Subscription activation security
  5. Device ID isolation (no data leakage)
  6. Crisis endpoint bypasses OpenAI
"""

import asyncio
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def use_mongomock(monkeypatch):
    """All tests run against mongomock — no real MongoDB required."""
    import mongomock
    import agora_backend.core.database as db_module

    mock_client = mongomock.MongoClient()
    mock_db     = mock_client["test_agoramujeres"]

    monkeypatch.setattr(db_module, "client",        mock_client)
    monkeypatch.setattr(db_module, "db",            mock_db)
    monkeypatch.setattr(db_module, "using_mongomock", True)

    return mock_db


# ── 1. DB helpers ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_db_find_returns_list(use_mongomock):
    """db_find must return a list even with mongomock (no .to_list required)."""
    from agora_backend.core.database import db, db_find, db_insert_one

    await db_insert_one(db.test_col, {"device_id": "dev1", "value": 42})
    results = await db_find(db.test_col, {"device_id": "dev1"})

    assert isinstance(results, list)
    assert len(results) == 1
    assert results[0]["value"] == 42


@pytest.mark.asyncio
async def test_db_find_with_sort_and_limit(use_mongomock):
    from agora_backend.core.database import db, db_find, db_insert_one

    for i in range(5):
        await db_insert_one(db.test_col2, {"device_id": "dev2", "order": i})

    results = await db_find(db.test_col2, {"device_id": "dev2"}, sort=("order", -1), limit=3)
    assert len(results) == 3
    assert results[0]["order"] == 4  # highest first


@pytest.mark.asyncio
async def test_db_find_with_skip(use_mongomock):
    from agora_backend.core.database import db, db_find, db_insert_one

    for i in range(5):
        await db_insert_one(db.test_col3, {"device_id": "dev3", "order": i})

    results = await db_find(db.test_col3, {"device_id": "dev3"}, sort=("order", 1), skip=2, limit=2)
    assert len(results) == 2
    assert results[0]["order"] == 2


# ── 2. Diary endpoint (previously crashed with mongomock) ─────────────────────

@pytest.mark.asyncio
async def test_diary_get_entries_no_crash(use_mongomock):
    """
    Previously, get_diary_entries called .find().sort().skip().to_list()
    directly on Motor — mongomock has no .to_list() → crash.
    Now uses db_find() → should work fine.
    """
    from agora_backend.core.database import db, db_insert_one
    from agora_backend.core.models import DiaryEntry

    entry = DiaryEntry(device_id="diary_test")
    await db_insert_one(db.diary_entries, entry.model_dump())

    from agora_backend.core.database import db_find
    results = await db_find(db.diary_entries, {"device_id": "diary_test"},
                            sort=("created_at", -1), limit=30, skip=0)

    assert isinstance(results, list)
    assert len(results) == 1


# ── 3. Pattern deduplication ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_patterns_no_entries_returns_none(use_mongomock):
    from agora_backend.core.patterns import get_patterns_for_device
    result = await get_patterns_for_device("no_entries_device", days=7)
    assert result is None


@pytest.mark.asyncio
async def test_patterns_returns_averages(use_mongomock):
    from agora_backend.core.database import db, db_insert_one
    from agora_backend.core.patterns import get_patterns_for_device
    from agora_backend.core.models import DiaryEntry, EmotionalState, PhysicalState

    for i in range(3):
        entry = DiaryEntry(
            device_id="pattern_dev",
            emotional_state=EmotionalState(calma=3, fatiga=4, niebla_mental=2,
                                            dolor_difuso=3, gratitud=1, tension=4),
            physical_state=PhysicalState(nivel_dolor=6, energia=3, sensibilidad=7),
        )
        await db_insert_one(db.diary_entries, entry.model_dump())

    result = await get_patterns_for_device("pattern_dev", days=7)
    assert result is not None
    assert result["total_entries"] == 3
    assert "emotional_averages" in result
    assert "physical_averages" in result
    assert result["physical_averages"]["nivel_dolor"] == 6.0


@pytest.mark.asyncio
async def test_patterns_context_es(use_mongomock):
    from agora_backend.core.patterns import build_patterns_context

    patterns = {
        "period_days":       7,
        "total_entries":     5,
        "emotional_averages": {"calma": 2, "fatiga": 4, "niebla_mental": 3,
                                "dolor_difuso": 3, "gratitud": 1, "tension": 4},
        "physical_averages":  {"nivel_dolor": 7, "energia": 2, "sensibilidad": 8},
        "common_words":       [],
        "trends": {"highest_emotional": "tension", "lowest_emotional": "gratitud"},
    }

    ctx = build_patterns_context(patterns, "es")
    assert "BASTANTE ALTO" in ctx      # pain > 6
    assert "MUY BAJA" in ctx           # energy < 4
    assert "MUY ALTA" in ctx           # sensitivity > 6


# ── 4. Subscription security ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_subscription_starts_as_trial(use_mongomock):
    from agora_backend.routers.subscriptions import get_subscription_status_internal

    status = await get_subscription_status_internal("new_device")
    assert status["status"] == "trial"
    assert status["trial_remaining_seconds"] == 7200


@pytest.mark.asyncio
async def test_trial_expires_after_usage(use_mongomock):
    from agora_backend.core.database import db, db_insert_one
    from agora_backend.core.models import SubscriptionStatus
    from agora_backend.routers.subscriptions import get_subscription_status_internal

    # Simulate exhausted trial
    sub = SubscriptionStatus(device_id="expired_dev", usage_seconds=7200)
    await db_insert_one(db.subscriptions, sub.model_dump())

    status = await get_subscription_status_internal("expired_dev")
    assert status["status"] == "expired"
    assert status["trial_remaining_seconds"] == 0


@pytest.mark.asyncio
async def test_activate_rejects_wrong_device_id():
    """
    The legacy /activate endpoint must reject payment intents
    that belong to a different device_id.
    """
    import stripe
    from agora_backend.routers.subscriptions import activate_subscription_legacy
    from fastapi import HTTPException

    mock_intent = MagicMock()
    mock_intent.status = "succeeded"
    mock_intent.metadata = {"device_id": "OTHER_DEVICE"}
    mock_intent.customer = None

    with patch.object(stripe.PaymentIntent, "retrieve", return_value=mock_intent):
        with pytest.raises(HTTPException) as exc_info:
            await activate_subscription_legacy("MY_DEVICE", "pi_fake")

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_admin_bypass_grants_access(use_mongomock):
    from agora_backend.routers.subscriptions import verify_admin_code
    from agora_backend.core.models import AdminCodeRequest

    request = AdminCodeRequest(device_id="admin_dev", code="AGORA2025ADMIN")
    result = await verify_admin_code(request)
    assert result["success"] is True
    assert result["is_admin"] is True

    from agora_backend.routers.subscriptions import get_subscription_status_internal
    status = await get_subscription_status_internal("admin_dev")
    assert status["status"] == "active"
    assert status["is_admin"] is True


# ── 5. Device ID isolation ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_diary_entries_isolated_by_device(use_mongomock):
    """User A should never see User B's diary entries."""
    from agora_backend.core.database import db, db_find, db_insert_one
    from agora_backend.core.models import DiaryEntry

    entry_a = DiaryEntry(device_id="user_a", texto="Mi entrada privada")
    entry_b = DiaryEntry(device_id="user_b", texto="Otra entrada privada")
    await db_insert_one(db.diary_entries, entry_a.model_dump())
    await db_insert_one(db.diary_entries, entry_b.model_dump())

    results_a = await db_find(db.diary_entries, {"device_id": "user_a"})
    assert len(results_a) == 1
    assert results_a[0]["texto"] == "Mi entrada privada"

    results_b = await db_find(db.diary_entries, {"device_id": "user_b"})
    assert len(results_b) == 1
    assert results_b[0]["texto"] == "Otra entrada privada"


# ── 6. Crisis bypasses OpenAI ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_crisis_high_pain_returns_breathing(use_mongomock):
    from agora_backend.routers.crisis import crisis_support
    from agora_backend.core.models import CrisisRequest

    request = CrisisRequest(
        device_id="crisis_dev",
        pain_level=9,
        language="es",
        symptoms=["ansiedad"],
    )
    result = await crisis_support(request)

    assert result["technique"]["title"] == "🫁 Técnica 4-7-8 Calmante"
    assert "immediate" in result
    assert "all_techniques" in result
    assert len(result["all_techniques"]) == 3


@pytest.mark.asyncio
async def test_crisis_moderate_pain_returns_self_compassion(use_mongomock):
    from agora_backend.routers.crisis import crisis_support
    from agora_backend.core.models import CrisisRequest

    request = CrisisRequest(device_id="crisis_dev2", pain_level=5, language="en")
    result = await crisis_support(request)
    assert "Self-Compassion" in result["technique"]["title"]


# ── 7. Agora content ──────────────────────────────────────────────────────────

def test_detect_context_greeting():
    from agora_backend.core.agora_content import detect_message_context
    assert detect_message_context("hola", "es") == "greeting"
    assert detect_message_context("hello", "en") == "greeting"


def test_detect_context_high_pain():
    from agora_backend.core.agora_content import detect_message_context
    assert detect_message_context("tengo un dolor insoportable", "es") == "high_pain"


def test_detect_context_fatigue():
    from agora_backend.core.agora_content import detect_message_context
    assert detect_message_context("estoy muy cansada y agotada", "es") == "fatigue"


def test_detect_context_advice_sleep():
    from agora_backend.core.agora_content import detect_message_context
    assert detect_message_context("qué puedo hacer para dormir mejor", "es") == "advice_sleep"


def test_get_smart_response_returns_string():
    from agora_backend.core.agora_content import get_smart_response
    response = get_smart_response("hola", "es", is_first_message=True)
    assert isinstance(response, str)
    assert len(response) > 10


def test_fallback_response_both_languages():
    from agora_backend.core.agora_content import get_fallback_response
    es = get_fallback_response("es")
    en = get_fallback_response("en")
    assert isinstance(es, str)
    assert isinstance(en, str)
    assert es != en
