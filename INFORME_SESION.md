# Informe de Sesión — AgoraMujeres
**Fecha:** 25 junio 2026  
**Proyecto:** `C:\Users\Usuario\AgoraMujeres`  
**Stack:** React Native / Expo SDK 51 / Expo Router · FastAPI (Python) · MongoDB (Motor) · Firebase Auth · Stripe

---

## ⚠️ Regla crítica
**NO tocar claves, credenciales ni archivos `.env`.** Ya fueron rotadas. Cualquier cambio en ese ámbito rompe producción.

---

## Bugs corregidos (7)

| # | Archivo | Problema | Fix |
|---|---------|----------|-----|
| 1 | `app-agora/services/api.ts` | Puerto Android `8001` → backend corre en `8000` | Cambiado a `http://10.0.2.2:8000` |
| 2 | `backend/routers/crisis.py` | Imports relativos rotos (`from ..core.*`) | Cambiados a imports absolutos (`from core.*`) |
| 3 | `backend/core/models.py` | `trial_end: Optional[datetime] = None` → llamada a `.isoformat()` crasheaba | Añadido `default_factory=lambda: datetime.now(timezone.utc)` |
| 4 | `backend/server.py` | CORS con `allow_origins=["*"]` | Reemplazado con lectura dinámica de env var `ALLOWED_ORIGINS` |
| 5 | `backend/routers/chat.py` | `print()` de debug filtraba la API key en logs | Reemplazado con `logger.debug()` |
| 6 | Múltiples archivos backend | `datetime.utcnow()` deprecado en Python 3.12 | Reemplazado con `datetime.now(timezone.utc)` en todos los routers y utils |
| 7 | `app-agora/app/(tabs)/sintomas-cronico.tsx` | `ts(7053)`: indexar objeto literal con variable `any` | Tipado como `Record<string, string>` |

**Archivos backend tocados para el bug 6:**
- `backend/routers/chat.py`
- `backend/routers/crisis.py`
- `backend/routers/misc.py`
- `backend/routers/resources.py`
- `backend/routers/subscriptions.py`
- `backend/core/patterns.py`
- `backend/auth/auth_utils.py`

---

## Endpoints nuevos añadidos a `backend/server.py`

```python
GET /api/health   # Ping MongoDB, devuelve status
GET /api/me       # Devuelve usuario actual desde JWT
```

---

## Bugs conocidos — APLAZADOS (riesgo alto)

- **Dual auth system:** `server.py` usa PyJWT, `auth/dependencies.py` usa python-jose. Coexisten. Unificarlos requiere testing dedicado.
- **DiaryEntry mismatch:** `DiaryEntryCreate` no tiene campo `content` — tiene `body`, `mind`, `soul`, `free`. No tocar sin revisar toda la cadena.

---

## Rediseño `app/index.tsx` (landing web)

Cambios visuales implementados:
- Hero: botón CTA "ENTRAR AL SANTUARIO" con animación FadeInDown
- Sección showcase: layout split (texto izquierda / mockup derecha en desktop)
- Mockup del teléfono: frame oscuro con burbujas de chat simuladas (reemplaza placeholder vacío)
- Badge de prueba social en la esquina del mockup
- Feature cards: icono envuelto, separador, 3 bullets por card
- Pricing: badge "Popular", listas de features, botones diferenciados por plan
- Footer: `marginTop` responsivo según breakpoint

---

## Rediseño `app/(tabs)/home.tsx` (pantalla principal app)

### Constantes añadidas (top del archivo)
```typescript
const AFIRMACIONES = [...]          // 7 frases, rotan por día de semana
const AGORA_MESSAGES = {...}        // Mensaje personalizado por fase del ciclo
const DOLOR_LABELS = [...]          // ['Bien', 'Regular', 'Con dolor', 'Mucho dolor', 'Insoportable']
const DOLOR_COLORS = [...]          // Paleta verde→rojo
const DOLOR_KEY = 'agora_dolor_level'
const DOLOR_DATE_KEY = 'agora_dolor_date'
```

### Cambios funcionales
1. **Timer de suscripción oculto** — ya no es lo primero visible. Topbar muestra icono de ajustes discreto; el contador aparece solo al tocarlo.
2. **Check-in de dolor persistente** — se guarda en AsyncStorage con fecha. Al reabrir la app el mismo día, recupera el nivel ya elegido sin preguntar dos veces.
3. **Afirmación diaria** — aparece entre el saludo y el check-in. Rota por día de semana. Ej: *"Cuidarte no es debilidad, es sabiduría."*
4. **Mensaje Ágora personalizado** — el texto bajo el orbe ya no es genérico. Usa `AGORA_MESSAGES[fase]` según la fase del ciclo.
5. **"% PROGRESO" eliminado** — reemplazado por "DÍA DE CUIDADO" (número de día actual del ciclo). Lenguaje de cuidado, no de rendimiento.
6. **Fila de accesos rápidos** — 3 botones siempre visibles: Apoyo inmediato · Escribir hoy · Hablar con Ágora.
7. **Empty states en métricas** — Glucosa y Síntomas muestran hint + pill "AÑADIR"/"REGISTRAR" cuando no hay datos.
8. **Banner comunidad** — actualizado a "{N} mujeres como tú están aquí hoy".

---

## Estado visual actual de la home (captura 25 jun)

La home funciona y se ve bien pero sigue siendo **demasiado convencional**: todas las secciones son cajas blancas redondeadas apiladas. Tiene aspecto de dashboard de salud genérico, no de refugio.

### Plan acordado para próxima sesión (por partes)

**Parte 1 — Romper la cuadrícula:**
- El orbe de Ágora debe ser el protagonista absoluto. Más grande, sin tarjeta contenedora.
- Check-in de dolor: los 5 puntos flotan sobre el fondo sin caja blanca.
- La afirmación diaria: tipografía grande, protagonista, no texto secundario tímido.

**Parte 2 — Reducir la home:**
- La tarjeta "MI CICLO" con 3 números es la más clínica. Moverla más abajo o a su pestaña.
- La home debería ser: *¿cómo estás hoy?* + *hablar con Ágora*. Nada más en el primer viewport.

**Parte 3 — Fondo vivo:**
- El degradado de fondo debería cambiar sutilmente según la fase (violáceo en lútea, verdoso en folicular, dorado en ovulatoria).
- Si el fondo respira, las tarjetas pueden ser más simples y el conjunto se siente más inmersivo.

---

## Cómo arrancar el proyecto

```bash
# Backend
cd AgoraMujeres/backend
python server.py

# App (Expo)
cd AgoraMujeres/app-agora
npx expo start
# Importante: correr desde app-agora/, no desde AgoraMujeres/app-agora/
```
