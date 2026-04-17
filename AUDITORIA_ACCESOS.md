# Auditoría y monitoreo de accesos

## 1. Logging de accesos y cambios

- Registra en un archivo o base de datos cada acceso a endpoints sensibles (diario, chat, ciclo, crisis, suscripción, etc):
  - device_id, endpoint accedido, timestamp, IP, resultado (éxito/error).
- No almacenes datos sensibles en los logs.

## 2. Ejemplo de implementación en FastAPI

Puedes crear un middleware en backend/server.py:

```python
from fastapi import Request
import logging

logger = logging.getLogger("access_audit")
handler = logging.FileHandler("access_audit.log")
logger.addHandler(handler)
logger.setLevel(logging.INFO)

@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    response = await call_next(request)
    user = request.headers.get("authorization", "-")
    logger.info(f"{request.client.host} {request.method} {request.url.path} {user} {response.status_code}")
    return response
```

## 3. Alertas

- Usa herramientas como Fail2Ban, Sentry o Prometheus para alertar ante:
  - Muchos intentos fallidos de login
  - Accesos desde IPs inusuales
  - Cambios masivos o borrados

## 4. Revisión periódica

- Revisa los logs semanalmente.
- Borra logs antiguos según tu política de retención.

---

**IMPORTANTE:**
- Los logs de auditoría deben estar protegidos y solo accesibles por administradores.
- No registrar nunca datos personales o sensibles en texto plano.
