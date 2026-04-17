# Política de contraseñas y autenticación robusta

## 1. Contraseñas seguras
- Longitud mínima: 8 caracteres (recomendado 12+)
- Deben incluir mayúsculas, minúsculas, números y símbolos
- No permitir contraseñas comunes (usa la lista de HaveIBeenPwned o similar)

## 2. Hashing seguro
- Usa bcrypt, argon2 o scrypt para almacenar hashes de contraseñas
- Nunca almacenes contraseñas en texto plano

## 3. Intentos de login limitados
- Bloquea temporalmente la cuenta tras 5 intentos fallidos
- Opción: añade captcha tras varios intentos

## 4. Autenticación multifactor (MFA)
- Si el proyecto escala, permite MFA vía email, SMS o app (ej: Authy, Google Authenticator)

## 5. Firebase Auth
- Si usas solo Google/Firebase, ya tienes autenticación robusta y delegas la seguridad en Google

## 6. Ejemplo de validación de contraseña en FastAPI
```python
import re
from fastapi import HTTPException

def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Contraseña demasiado corta")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Debe incluir mayúsculas")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Debe incluir minúsculas")
    if not re.search(r"[0-9]", password):
        raise HTTPException(status_code=400, detail="Debe incluir números")
    if not re.search(r"[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]", password):
        raise HTTPException(status_code=400, detail="Debe incluir símbolos")
```

---

**IMPORTANTE:**
- Obliga a cambiar la contraseña periódicamente si usas autenticación propia.
- Permite recuperación de contraseña solo vía email seguro.
- Si usas solo Google/Firebase, revisa que no se pueda registrar/login con email duplicado.
