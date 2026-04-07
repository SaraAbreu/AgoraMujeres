"""
Misc routers — cycle tracking, weather, monthly pain records.
"""

import logging
from datetime import datetime
from typing import List, Optional

import httpx
from fastapi import APIRouter, HTTPException

from ..core.database import db, db_delete_one, db_find, db_insert_one, db_update_one
from ..core.models import CycleEntry, CycleEntryCreate, MonthlyPainRecordCreate

logger = logging.getLogger(__name__)

# ── Cycle router ──────────────────────────────────────────────────────────────

cycle_router = APIRouter(prefix="/cycle", tags=["cycle"])


@cycle_router.post("", response_model=CycleEntry)
async def create_cycle_entry(entry: CycleEntryCreate):
    entry_obj = CycleEntry(**entry.model_dump())
    await db_insert_one(db.cycle_entries, entry_obj.model_dump())
    return entry_obj


@cycle_router.get("/{device_id}", response_model=List[CycleEntry])
async def get_cycle_entries(device_id: str, limit: int = 12):
    entries = await db_find(
        db.cycle_entries,
        {"device_id": device_id},
        sort=("start_date", -1),
        limit=limit,
    )
    return [CycleEntry(**e) for e in entries]


# ── Weather router ────────────────────────────────────────────────────────────

weather_router = APIRouter(prefix="/weather", tags=["weather"])

_WEATHER_CODES = {
    0: "clear", 1: "mainly_clear", 2: "partly_cloudy", 3: "overcast",
    45: "fog", 48: "fog",
    51: "drizzle", 53: "drizzle", 55: "drizzle",
    61: "rain", 63: "rain", 65: "rain",
    71: "snow", 73: "snow", 75: "snow",
    80: "showers", 81: "showers", 82: "showers",
    95: "thunderstorm",
}


@weather_router.get("")
async def get_weather(lat: float, lon: float):
    """Proxy to Open-Meteo (free, no API key required)."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude":  lat,
                    "longitude": lon,
                    "current":   "temperature_2m,relative_humidity_2m,weather_code,pressure_msl",
                    "timezone":  "auto",
                },
            )
            data    = resp.json()
            current = data.get("current", {})
            code    = current.get("weather_code", 0)

            return {
                "temperature": current.get("temperature_2m"),
                "humidity":    current.get("relative_humidity_2m"),
                "pressure":    current.get("pressure_msl"),
                "condition":   _WEATHER_CODES.get(code, "unknown"),
                "weather_code": code,
            }
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        raise HTTPException(status_code=502, detail="Weather service unavailable.")


# ── Monthly pain record router ────────────────────────────────────────────────

monthly_router = APIRouter(prefix="/monthly-record", tags=["monthly-record"])


@monthly_router.get("/{device_id}")
async def get_monthly_record(device_id: str):
    record = await db.monthly_records.find_one({"device_id": device_id})
    if not record:
        return {
            "device_id":        device_id,
            "records":          [],
            "cycle_start_date": datetime.utcnow().isoformat(),
            "created_at":       datetime.utcnow().isoformat(),
        }
    return _serialize_record(record)


@monthly_router.post("/{device_id}")
async def save_monthly_record(device_id: str, data: MonthlyPainRecordCreate):
    cycle_start = datetime.fromisoformat(
        data.cycle_start_date.replace("Z", "+00:00").replace("+00:00", "")
    )
    await db.monthly_records.update_one(
        {"device_id": device_id},
        {
            "$set": {
                "device_id":        device_id,
                "records":          data.records,
                "cycle_start_date": cycle_start,
                "updated_at":       datetime.utcnow(),
            },
            "$setOnInsert": {"created_at": datetime.utcnow()},
        },
        upsert=True,
    )
    return {
        "device_id":        device_id,
        "records":          data.records,
        "cycle_start_date": cycle_start.isoformat(),
        "message":          "Record saved successfully",
    }


@monthly_router.delete("/{device_id}")
async def delete_monthly_record(device_id: str):
    await db_delete_one(db.monthly_records, {"device_id": device_id})
    return {"message": "Record deleted", "device_id": device_id}


def _serialize_record(record: dict) -> dict:
    def _iso(v):
        return v.isoformat() if isinstance(v, datetime) else v

    return {
        "device_id":        record["device_id"],
        "records":          record.get("records", []),
        "cycle_start_date": _iso(record.get("cycle_start_date")),
        "created_at":       _iso(record.get("created_at")),
    }
