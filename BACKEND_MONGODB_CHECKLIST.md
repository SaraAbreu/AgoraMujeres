# Checklist de integración MongoDB real en producción

1. **Verificar acceso a MongoDB Atlas**
   - [ ] Probar conexión con MongoDB Compass usando la URI de `.env`
   - [ ] Confirmar que la base de datos y colecciones existen

2. **Variables de entorno**
   - [ ] Revisar que `MONGO_URI` y `DB_NAME` estén correctamente configuradas en `.env` de producción
   - [ ] No exponer `.env` en el repositorio (debe estar en `.gitignore`)

3. **Despliegue backend**
   - [ ] Subir el backend a Railway/Render/VPS con el archivo `.env` correcto
   - [ ] Verificar logs de arranque: debe aparecer `✅ Connected to MongoDB`

4. **Pruebas funcionales**
   - [ ] Registrar un usuario nuevo (endpoint `/api/auth/register`)
   - [ ] Iniciar sesión (endpoint `/api/auth/login`)
   - [ ] Crear y consultar entradas de diario/chat
   - [ ] Verificar que los datos persisten tras reiniciar el backend

5. **Restricción de mongomock**
   - [ ] (Opcional) Modificar código para lanzar error si MongoDB real no está disponible en producción

6. **Seguridad**
   - [ ] Revisar reglas de acceso IP en MongoDB Atlas (permitir solo IPs necesarias)
   - [ ] Rotar credenciales periódicamente

7. **Backup**
   - [ ] Configurar backups automáticos en MongoDB Atlas

---

**Notas:**
- Si algún paso falla, revisar logs y configuración de red/firewall.
- No usar mongomock en producción salvo para pruebas controladas.
