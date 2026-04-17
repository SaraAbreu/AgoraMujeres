"""
Misc routers — cycle tracking, weather, monthly pain records.
"""

import logging
from datetime import datetime
from typing import List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Depends
from auth.dependencies import get_current_user

from ..core.database import db, db_delete_one, db_find, db_insert_one, db_update_one
from ..core.models import CycleEntry, CycleEntryCreate, MonthlyPainRecordCreate
from ..core.crypto_utils import encrypt_text, decrypt_text
from ..core.crypto_utils import encrypt_text, decrypt_text

logger = logging.getLogger(__name__)

# ── Cycle router ──────────────────────────────────────────────────────────────

cycle_router = APIRouter(prefix="/cycle", tags=["cycle"])


@cycle_router.post("", response_model=CycleEntry)
async def create_cycle_entry(entry: CycleEntryCreate, user=Depends(get_current_user)):
    if hasattr(user, 'device_id') and user.device_id != entry.device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    data = entry.model_dump()
    data["zone"] = encrypt_text(data["zone"])
    entry_obj = CycleEntry(**data)
    await db_insert_one(db.cycle_entries, entry_obj.model_dump())
    # Devuelve el campo descifrado para el frontend
    entry_obj.zone = entry.zone
    return entry_obj


@cycle_router.get("/{device_id}", response_model=List[CycleEntry])
async def get_cycle_entries(device_id: str, limit: int = 12, user=Depends(get_current_user)):
    if hasattr(user, 'device_id') and user.device_id != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    entries = await db_find(
        db.cycle_entries,
        {"device_id": device_id},
        sort=("start_date", -1),
        limit=limit,
    )
    result = []
    for e in entries:
        try:
            e["zone"] = decrypt_text(e["zone"])
        except Exception:
            e["zone"] = "[ERROR: No se pudo descifrar]"
        result.append(CycleEntry(**e))
    return result


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
async def get_monthly_record(device_id: str, user=Depends(get_current_user)):
    if hasattr(user, 'device_id') and user.device_id != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
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
async def save_monthly_record(device_id: str, data: MonthlyPainRecordCreate, user=Depends(get_current_user)):
    if hasattr(user, 'device_id') and user.device_id != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    cycle_start = datetime.fromisoformat(
        data.cycle_start_date.replace("Z", "+00:00").replace("+00:00", "")
    )
    # Cifrar el campo records (como string JSON)
    import json
    encrypted_records = encrypt_text(json.dumps(data.records))
    await db.monthly_records.update_one(
        {"device_id": device_id},
        {
            "$set": {
                "device_id":        device_id,
                "records":          encrypted_records,
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


@monthly_router.get("/{device_id}")
async def get_monthly_record(device_id: str, user=Depends(get_current_user)):
    if hasattr(user, 'device_id') and user.device_id != device_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    import json
    record = await db.monthly_records.find_one({"device_id": device_id})
    if not record:
        return {
            "device_id":        device_id,
            "records":          [],
            "cycle_start_date": datetime.utcnow().isoformat(),
            "created_at":       datetime.utcnow().isoformat(),
        }
    # Descifrar el campo records
    try:
        record["records"] = json.loads(decrypt_text(record["records"]))
    except Exception:
        record["records"] = []
    return _serialize_record(record)
        "cycle_start_date": _iso(record.get("cycle_start_date")),
        "created_at":       _iso(record.get("created_at")),
    }
