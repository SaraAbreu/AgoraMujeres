FROM python:3.11-slim
WORKDIR /app

# Copiamos los requerimientos desde la carpeta backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos TODO lo que hay dentro de la carpeta backend al contenedor
COPY backend/ .

# Exponemos el puerto
EXPOSE 8000

# Arrancamos el servidor (Railway usará este comando)
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]