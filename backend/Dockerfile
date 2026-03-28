# ─────────────────────────────────────────────────────────────────────────────
#  Dockerfile — Ágora Mujeres Backend (FastAPI + MongoDB Atlas)
#  Destino: Railway
#  Estrategia: multi-stage → imagen final ~200 MB en vez de ~800 MB
# ─────────────────────────────────────────────────────────────────────────────

# ── Etapa 1: instalar dependencias ────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Evitar archivos .pyc y buffering de stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Dependencias del sistema solo para compilar (gcc necesario para grpcio, bcrypt, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar en carpeta aislada /install
# (no instalamos en el sistema → la imagen final queda limpia)
COPY requirements.txt .
RUN pip install --upgrade pip --quiet && \
    pip install --prefix=/install --no-cache-dir -r requirements.txt


# ── Etapa 2: imagen de producción ─────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Railway inyecta $PORT automáticamente; 8000 es el fallback para local
    PORT=8000

# Copiar paquetes compilados desde la etapa builder
COPY --from=builder /install /usr/local

# Copiar el código fuente del backend
# Ajusta esta ruta si tu backend vive en una subcarpeta (ej: COPY ./backend /app)
COPY . .

# Puerto que Railway expondrá (Railway lo sobreescribe con $PORT en runtime)
EXPOSE 8000

# ── Healthcheck ───────────────────────────────────────────────────────────────
# Railway usa este endpoint para saber si el servicio está listo.
# Asegúrate de que GET /health devuelva 200 en tu server.py (ver nota abajo).
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# ── Arranque ──────────────────────────────────────────────────────────────────
# Usamos sh -c para que $PORT se expanda en runtime (Railway lo inyecta como variable de entorno)
CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT} --workers 2"]
