# Usa una imagen de Python oficial
FROM python:3.11-slim

# Establece el directorio de trabajo (esto sustituye al "cd")
WORKDIR /app

# Copia los archivos de requerimientos primero para aprovechar la caché
COPY requirements.txt .

# Instala las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo el contenido de tu carpeta backend al contenedor
COPY . .

# Expone el puerto que usa FastAPI
EXPOSE 8000

# Comando para arrancar la aplicación
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]