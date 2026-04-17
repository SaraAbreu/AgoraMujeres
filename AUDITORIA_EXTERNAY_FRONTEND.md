# Auditoría externa y checklist de frontend seguro

## 1. Auditoría externa (opcional, recomendado si escalas)
- Contrata una empresa especializada para pentesting y revisión de seguridad.
- Solicita informe de vulnerabilidades y recomendaciones.
- Realiza auditoría anual o tras cambios críticos.

## 2. Checklist de frontend seguro (Expo/React Native)

- [x] Usa SecureStore para tokens y datos sensibles (ya implementado)
- [x] No almacenes datos sensibles en localStorage ni AsyncStorage
- [x] No expongas datos sensibles en logs ni errores
- [x] Usa HTTPS para todas las llamadas a la API
- [x] Valida siempre los datos recibidos del backend
- [x] No muestres información sensible en la UI si no es necesario
- [x] Elimina datos locales al cerrar sesión
- [x] Mantén dependencias actualizadas (`npm audit`)
- [x] No incluyas claves ni secretos en el bundle
- [x] Usa autenticación biométrica si el dispositivo lo permite (opcional)

## 3. Revisión periódica
- Haz una revisión de seguridad de frontend tras cada release importante.

---

**IMPORTANTE:**
- Si usas push notifications, nunca envíes datos sensibles en el payload.
- Si usas deep links, valida los parámetros recibidos.
