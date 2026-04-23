# Procedimiento de Seguridad y Backups para Ágora Mujeres

## Seguridad en MongoDB Atlas

1. **Whitelist de IPs**
   - Accede a tu proyecto en MongoDB Atlas.
   - Ve a "Network Access" y añade solo las IPs necesarias (servidor backend, desarrolladores autorizados).

2. **Usuarios y Roles**
   - Crea un usuario específico para la app con permisos mínimos (solo lectura/escritura en la base de datos de la app).
   - No uses el usuario admin para la conexión de producción.

3. **Gestión de Claves**
   - Mantén las URIs y claves en archivos `.env` (nunca en el código fuente).
   - Rota las claves periódicamente y elimina usuarios antiguos.

4. **Conexión Segura**
   - Usa siempre la URI con `mongodb+srv://` y TLS/SSL habilitado.
   - El backend debe correr bajo HTTPS en producción.

5. **Autenticación y Autorización**
   - Todos los endpoints sensibles deben requerir autenticación.
   - Usa Firebase Auth y valida tokens en backend.

---

## Backups en MongoDB Atlas

1. **Activar Backups**
   - Entra a tu clúster en Atlas > "Backups".
   - Activa "Continuous Backup" o "Snapshot" según tu plan.

2. **Verificar Backups**
   - Revisa periódicamente que los backups se estén generando correctamente.
   - Descarga y restaura un backup de prueba al menos una vez al trimestre.

3. **Restaurar Backup**
   - Desde Atlas, selecciona el backup y elige "Restore".
   - Puedes restaurar a un nuevo clúster o sobreescribir el actual (¡cuidado en producción!).
   - Documenta la fecha, motivo y resultado de cada restauración.

---

## Consideraciones para Publicar en Google Play

- **No expongas claves ni URIs en el APK ni en el frontend**.
- El backend debe ser el único que accede a la base de datos y a las claves sensibles.
- Usa HTTPS para todas las comunicaciones entre app y backend.
- Cumple con la política de privacidad y manejo de datos de Google Play.
- Documenta el proceso de alta, baja y recuperación de cuentas de usuario.

---

**Última revisión:** 2026-04-19
