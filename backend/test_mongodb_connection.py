"""
Script de test de conexión a MongoDB Atlas.

Lee la URI y el nombre de la base de datos desde el entorno (.env).
Intenta conectar y listar las colecciones disponibles.
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

MONGO_URI = os.environ.get("MONGO_URI")
DB_NAME = os.environ.get("DB_NAME", "agoramujeres")

async def test_connection():
    if not MONGO_URI:
        print("❌ MONGO_URI no está definida en el entorno.")
        return
    try:
        client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        # Prueba de conexión
        await client.server_info()
        db = client[DB_NAME]
        collections = await db.list_collection_names()
        print(f"✅ Conexión exitosa a MongoDB. Colecciones en '{DB_NAME}':")
        for col in collections:
            print(f"  - {col}")
        client.close()
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
