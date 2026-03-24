"""
Database connection and helper layer.

Supports both Motor (async MongoDB) and mongomock (sync, for dev/test).
All endpoints must use these helpers — never call Motor methods directly.
"""

import asyncio
import logging
import os
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Global state — set during lifespan startup
client = None
db = None
using_mongomock: bool = False


# ── Connection ──────────────────────────────────────────────────────────────

async def connect() -> None:
    """Connect to MongoDB. Falls back to mongomock if unavailable."""
    global client, db, using_mongomock

    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name   = os.environ.get("DB_NAME", "agoramujeres")

    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        _client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
        await asyncio.wait_for(_client.server_info(), timeout=2.0)
        client = _client
        db = client[db_name]
        using_mongomock = False
        logger.info("✅ Connected to MongoDB")
        await _ensure_indexes()
    except Exception as e:
        import mongomock
        logger.warning(f"⚠️  MongoDB unavailable ({e}). Using mongomock.")
        client = mongomock.MongoClient()
        db = client[db_name]
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

async def _ensure_indexes() -> None:
    """
    Create indexes on startup (idempotent — safe to run every boot).
    Missing indexes caused full-collection scans on every chat request.
    """
    indexes = [
        (db.chat_messages,      [("device_id", 1), ("conversation_id", 1), ("created_at", -1)]),
        (db.chat_conversations, [("device_id", 1), ("updated_at", -1)]),
        (db.diary_entries,      [("device_id", 1), ("created_at", -1)]),
        (db.subscriptions,      [("device_id", 1)]),
        (db.cycle_entries,      [("device_id", 1), ("start_date", -1)]),
        (db.message_reactions,  [("device_id", 1), ("message_id", 1)]),
        (db.favorite_messages,  [("device_id", 1)]),
        (db.crisis_logs,        [("device_id", 1), ("created_at", -1)]),
        (db.monthly_records,    [("device_id", 1)]),
        (db.resources,          [("language", 1), ("category", 1), ("is_featured", -1)]),
    ]
    for collection, index_spec in indexes:
        try:
            await collection.create_index(index_spec)
        except Exception as e:
            logger.warning(f"Index creation skipped for {collection.name}: {e}")
    logger.info("✅ MongoDB indexes ensured.")


# ── CRUD helpers ─────────────────────────────────────────────────────────────
# These are the ONLY way routers should touch the database.

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
    """
    Find multiple documents.

    Args:
        sort:  (field, direction) tuple — e.g. ("created_at", -1)
        limit: max documents to return
        skip:  number of documents to skip (pagination)
    """
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
