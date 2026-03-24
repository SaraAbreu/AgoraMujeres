"""
Diary router — emotional & physical state logging.
"""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException

from ..core.database import db, db_count_documents, db_find, db_insert_one
from ..core.models import DiaryEntry, DiaryEntryCreate
from ..core.patterns import get_patterns_for_device
from .subscriptions import track_usage

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/diary", tags=["diary"])


@router.post("", response_model=DiaryEntry)
async def create_diary_entry(entry: DiaryEntryCreate):
    entry_obj = DiaryEntry(**entry.model_dump())
    await db_insert_one(db.diary_entries, entry_obj.model_dump())
    await track_usage(entry.device_id, 60)
    return entry_obj


@router.get("/{device_id}", response_model=List[DiaryEntry])
async def get_diary_entries(device_id: str, limit: int = 30, offset: int = 0):
    entries = await db_find(
        db.diary_entries,
        {"device_id": device_id},
        sort=("created_at", -1),
        limit=limit,
        skip=offset,
    )
    return [DiaryEntry(**e) for e in entries]


@router.get("/{device_id}/patterns")
async def get_patterns(device_id: str, days: int = 7):
    result = await get_patterns_for_device(device_id, days)
    if result is None:
        return {"patterns": None, "message": "No hay suficientes datos para analizar patrones"}
    return result
