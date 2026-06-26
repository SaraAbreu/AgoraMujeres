"""
Database connection and helper layer.

Supports both Motor (async MongoDB) and mongomock (sync, for dev/test).
All endpoints must use these helpers — never call Motor methods directly.
"""

import asyncio
import logging
import os
import mongomock
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ── Global state — inicializado en None, se rellena en connect() ─────────────
# BUG CORREGIDO: antes se llamaba AsyncIOMotorClient() aquí en el módulo,
# antes de que mongo_uri estuviera definida → NameError al importar.
client        = None
db            = None
using_mongomock: bool = False


# ── Connection ──────────────────────────────────────────────────────────────

async def connect() -> None:
    """Connect to MongoDB. Falls back to mongomock if unavailable."""
    global client, db, using_mongomock

    # BUG CORREGIDO: la versión rota usaba variables locales `mongo_url` y
    # `db_name` que nunca se definían dentro de la función.
    mongo_url = os.environ.get("MONGO_URL") or os.environ.get("MONGO_URI", "mongodb://localhost:27017")
    db_name   = os.environ.get("DB_NAME", "agoramujeres")

    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        _client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=15000)
        await asyncio.wait_for(_client.server_info(), timeout=15.0)
        client         = _client
        db             = client[db_name]
        using_mongomock = False
        logger.info("✅ Connected to MongoDB")
        await ensure_indexes(db)
        logger.info("✅ MongoDB indexes ensured.")
    except Exception as e:
        if os.environ.get("ENV", "development").lower() == "production":
            logger.error(f"❌ MongoDB no disponible en producción: {e}")
            raise RuntimeError("MongoDB no disponible en producción. Abortando arranque.")

        logger.warning(f"⚠️  MongoDB unavailable. Tipo: {type(e).__name__} | {repr(e)}")
        logger.warning(f"⚠️  URI (primeros 40 chars): {mongo_url[:40]}")
        logger.warning("⚠️  Usando mongomock.")
        client         = mongomock.MongoClient()
        db             = client[db_name]
        using_mongomock = True


async def disconnect() -> None:
    """Close the MongoDB connection safely."""
    global client
    try:
        if client and not using_mongomock:
            client.close()
            logger.info("MongoDB connection closed.")
    except Exception as e:
        logger.error(f"Error closing MongoDB: {e}")


# ── Indexes ──────────────────────────────────────────────────────────────────

async def ensure_indexes(db_instance) -> None:
    """Create all collection indexes. Called once during lifespan startup."""
    # BUG CORREGIDO: en la versión rota había un `await collection.create_index`
    # escrito directamente en el cuerpo del módulo (fuera de una función async)
    # → SyntaxError: 'await' outside function.
    if db_instance is None:
        logger.warning("ensure_indexes: db is None, skipping.")
        return

    indexes = [
        (db_instance.chat_messages,      [("device_id", 1), ("conversation_id", 1), ("created_at", -1)]),
        (db_instance.chat_conversations, [("device_id", 1), ("updated_at", -1)]),
        (db_instance.diary_entries,      [("device_id", 1), ("created_at", -1)]),
        (db_instance.subscriptions,      [("device_id", 1)]),
        (db_instance.cycle_entries,      [("device_id", 1), ("start_date", -1)]),
        (db_instance.message_reactions,  [("device_id", 1), ("message_id", 1)]),
        (db_instance.favorite_messages,  [("device_id", 1)]),
        (db_instance.crisis_logs,        [("device_id", 1), ("created_at", -1)]),
        (db_instance.monthly_records,    [("device_id", 1)]),
        (db_instance.resources,          [("language", 1), ("category", 1), ("is_featured", -1)]),
        (db_instance.sintomas_cronico,   [("device_id", 1), ("created_at", -1)]),
    ]

    for collection, index_spec in indexes:
        try:
            await collection.create_index(index_spec)
        except Exception as e:
            logger.warning(f"Index creation skipped for {collection.name}: {e}")


# ── CRUD helpers ──────────────────────────────────────────────────────────────

async def db_find_one(collection, query: Dict) -> Optional[Dict]:
    if using_mongomock:
        return collection.find_one(query)
    return await collection.find_one(query)


async def db_find(
    collection,
    query: Dict,
    sort: Optional[Tuple] = None,
    limit: Optional[int] = None,
    skip: int = 0,
) -> List[Dict]:
    if using_mongomock:
        cursor = collection.find(query)
        if sort:
            cursor = cursor.sort(sort[0], sort[1])
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)
    else:
        cursor = collection.find(query)
        if sort:
            cursor = cursor.sort(sort[0], sort[1])
        if skip:
            cursor = cursor.skip(skip)
        if limit:
            cursor = cursor.limit(limit)
        return await cursor.to_list(limit or 1000)


async def db_insert_one(collection, document: Dict) -> Any:
    if using_mongomock:
        return collection.insert_one(document)
    return await collection.insert_one(document)


async def db_insert_many(collection, documents: List[Dict]) -> Any:
    if using_mongomock:
        return collection.insert_many(documents)
    return await collection.insert_many(documents)


async def db_update_one(
    collection, query: Dict, update: Dict, upsert: bool = False
) -> Any:
    if using_mongomock:
        return collection.update_one(query, update, upsert=upsert)
    return await collection.update_one(query, update, upsert=upsert)


async def db_delete_one(collection, query: Dict) -> Any:
    if using_mongomock:
        return collection.delete_one(query)
    return await collection.delete_one(query)


async def db_delete_many(collection, query: Dict) -> Any:
    if using_mongomock:
        return collection.delete_many(query)
    return await collection.delete_many(query)


async def db_count_documents(collection, query: Dict) -> int:
    if using_mongomock:
        return collection.count_documents(query)
    return await collection.count_documents(query)


async def db_aggregate(collection, pipeline: List[Dict]) -> List[Dict]:
    """Run an aggregation pipeline (not supported in mongomock — returns [])."""
    if using_mongomock:
        logger.warning("Aggregation not supported in mongomock — returning [].")
        return []
    return await collection.aggregate(pipeline).to_list(1000)