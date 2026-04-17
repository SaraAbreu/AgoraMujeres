# Control de acceso y roles (base para escalabilidad)

## 1. Diseño de roles
- Define roles básicos: `usuaria`, `admin`, `profesional` (si aplica).
- Añade un campo `role` al modelo de usuario en la base de datos.

## 2. Ejemplo de modelo de usuario
```python
# backend/core/models.py
class User(BaseModel):
    email: str
    role: str = "usuaria"  # valores posibles: usuaria, admin, profesional
    # ...otros campos...
```

## 3. Middleware o dependencia de autorización

Crea una dependencia en FastAPI para proteger endpoints según el rol:

```python
from fastapi import Depends, HTTPException

def require_role(required_role: str):
    def role_checker(user=Depends(get_current_user)):
        if getattr(user, "role", "usuaria") != required_role:
            raise HTTPException(status_code=403, detail="No autorizado")
        return user
    return role_checker

# Uso en endpoint:
@router.get("/admin/usuarios")
async def listar_usuarios(user=Depends(require_role("admin"))):
    ...
```

## 4. Escalabilidad
- Si en el futuro hay más roles o permisos, usa una lista de permisos en vez de un solo campo.

---

**IMPORTANTE:**
- No expongas nunca el campo `role` al frontend salvo para mostrar la UI adecuada.
- Los cambios de rol solo deben poder hacerlos administradores.
