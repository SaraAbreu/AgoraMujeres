# Política de privacidad y derecho al olvido

## 1. Política de privacidad clara
- Redacta una política de privacidad sencilla y accesible para las usuarias.
- Explica qué datos se recogen, cómo se usan, cómo se protegen y cómo se pueden eliminar.
- Publica el enlace en la app y en la web.

## 2. Derecho al olvido (eliminación total de datos)
- Implementa un endpoint seguro para que la usuaria pueda solicitar la eliminación completa de su cuenta y todos sus datos:

```python
@app.delete("/api/user/delete-account")
async def delete_account(user=Depends(get_current_user)):
    # Borra todos los datos relacionados con user.device_id/email
    ...
    return {"message": "Cuenta y datos eliminados permanentemente"}
```

- Solicita confirmación antes de eliminar.
- Elimina todos los registros en todas las colecciones (diario, chat, ciclo, crisis, etc).

## 3. Confirmación y transparencia
- Informa a la usuaria cuando sus datos hayan sido eliminados.
- No guardes ningún dato tras la eliminación.

---

**IMPORTANTE:**
- Cumple con GDPR/LOPD si tienes usuarias en Europa.
- No bloquees el acceso a la app por no aceptar la política, pero sí limita funcionalidades.
