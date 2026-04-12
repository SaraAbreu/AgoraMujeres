# Ágora Mujeres - Plataforma Integral de Salud Mental para Mujeres

## 📋 Descripción General del Proyecto

**Ágora Mujeres** es una plataforma multiplataforma de salud mental y bienestar emocional diseñada específicamente para mujeres. Combina inteligencia artificial conversacional empática, diario emocional, rastreo de ciclo menstrual, recursos educativos y protocolo de soporte en crisis.

### Características Principales

- 💬 **Chat con IA Empática**: Conversaciones personalizadas con GPT-4o-mini
- 📔 **Diario Emocional**: Registro estructurado de sentimientos (cuerpo, mente, alma, suelto)
- 🔄 **Rastreo de Ciclo Menstrual**: Seguimiento y predicciones personalizadas
- 🆘 **Protocolo de Crisis**: Soporte y recursos de emergencia
- 📚 **Recursos Educativos**: Información sobre salud mental y bienestar
- 💳 **Sistema de Suscripción Premium**: Acceso a todas las funcionalidades

### Stack Tecnológico

**Backend:**
- Python 3.x
- FastAPI + Uvicorn (API REST moderna y asíncrona)
- MongoDB (base de datos flexible)
- OpenAI GPT-4o-mini (IA conversacional)
- Stripe (procesamiento de pagos)
- Firebase (autenticación segura)

**Frontend:**
- React Native + Expo (multiplataforma: iOS, Android, Web)
- TypeScript (tipado fuerte)
- Expo Router (routing file-based)
- React Context (gestión de estado)
- Stripe SDK (pagos en app)
- i18next (multiidioma)

---

## 🔧 Análisis Completo del Proyecto Realizado

### Arquitectura & Estructura

El proyecto sigue una arquitectura **Backend + Frontend desacoplados**, permitiendo:
- Escalabilidad independiente de cada capa
- Mantenimiento más sencillo
- Facilidad para agregar nuevas plataformas

#### Backend (FastAPI)

- **server.py**: API principal con todos los endpoints
- **core/models.py**: Modelos Pydantic para tipado fuerte
- **core/llm_adapter.py**: Abstracción inteligente para cambiar proveedores de IA sin modificar el código del chat
- **core/agora_content.py**: Sistema de prompts y lógica conversacional empática
- **core/database.py**: Funciones encapsuladas de MongoDB
- **core/patterns.py**: Análisis de patrones emocionales y tendencias
- **routers/**: Endpoints organizados por dominio (auth, chat, diary, crisis, subscriptions, resources, misc)

#### Frontend (Expo)

- **app/**: Rutas usando Expo Router (estructura file-based)
  - `(auth)/`: Pantallas de autenticación
  - `(tabs)/`: Navegación principal con tabs (home, chat, diary, profile)
  - `conversations/`: Historial de conservaciones
  - `cycle/`: Información y tracker de ciclo menstrual
  - `crisis.tsx`: Pantalla de soporte en crisis
  - `subscription.tsx`: Gestión de suscripciones
- **src/**: Código compartido reutilizable
  - `components/`: Componentes React personalizados
  - `services/`: Llamadas a la API backend
  - `hooks/`: React Hooks personalizados
  - `store/`: Gestión de estado global
  - `theme/`: Sistema de diseño (colores, tipografía)
  - `i18n/`: Traducciones y localización
  - `config/`: Configuración general

### Patrones Arquitectónicos Implementados

✅ **Adapter Pattern**: `llm_adapter.py` abstrae OpenAI, permitiendo cambiar de proveedor de IA sin modificar la lógica del chat

✅ **Router Pattern**: Cada dominio en su propio archivo (auth.py, chat.py, diary.py, etc.), mejorando modularidad y testabilidad

✅ **Database Abstraction**: Funciones helpers en database.py encapsulan toda la lógica de MongoDB

✅ **File-Based Routing**: Expo Router automatiza rutas basadas en estructura de carpetas

### Endpoints API Principales

**Autenticación:**
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/logout` - Cerrar sesión

**Chat & Conversaciones:**
- `POST /api/chat` - Enviar mensaje y recibir respuesta IA
- `GET /api/conversations` - Listar todas las conversaciones
- `GET /api/conversations/{id}` - Detalle de una conversación

**Diario Emocional:**
- `POST /api/diary/entries` - Crear nueva entrada
- `GET /api/diary/entries` - Listar todas las entradas
- `PUT /api/diary/entries/{id}` - Actualizar entrada

**Ciclo Menstrual:**
- `GET /api/cycle/info` - Información del ciclo
- `POST /api/cycle/prediction` - Predicciones

**Suscripciones & Pagos:**
- `GET /api/subscriptions/status` - Estado de suscripción
- `POST /api/subscriptions/create` - Crear suscripción
- `POST /api/subscriptions/webhook` - Webhook de Stripe

**Crisis:**
- `POST /api/crisis/report` - Reportar situación de crisis
- `GET /api/crisis/resources` - Recursos de emergencia

### Seguridad Implementada

- 🔐 **CORS Restringido**: Solo dominios autorizados pueden acceder
- 🔐 **Variables de Entorno**: Todas las credenciales protegidas
- 🔐 **Firebase Auth**: Autenticación segura y moderna
- 🔐 **Stripe PCI-Compliant**: Cumple estándares internacionales de seguridad
- 🔐 **OpenAI API Keys**: Protegidas en backend
- 🔐 **Datos Sensibles**: Nunca expuestos en logs o errores

### Dependencias Principales

**Backend:**
- fastapi, uvicorn, motor (async MongoDB)
- pydantic (validación de datos)
- openai (IA conversacional)
- stripe (pagos)
- firebase-admin (autenticación)
- python-dotenv (variables de entorno)

**Frontend:**
- expo, react, react-native
- expo-router (routing)
- @stripe/react-native (pagos in-app)
- firebase (autenticación)
- i18next (traducciones)
- lucide-react-native (iconos)

### Flujo de Trabajo Completo

1. **Usuario abre la app** → Frontend Expo carga
2. **Autentica con Firebase** → Obtiene JWT token
3. **Escribe mensaje de chat** → Frontend envía a `POST /api/chat`
4. **Backend procesa** → Recupera contexto de conversación anterior de MongoDB
5. **IA genera respuesta** → Usa `llm_adapter.py` → OpenAI GPT-4o-mini
6. **Guarda en BD** → MongoDB almacena mensaje y respuesta
7. **Retorna al frontend** → JSON response
8. **Muestra en UI** → React actualiza automáticamente

---

## 🚀 Instalación y Despliegue

### Backend

1. Instala dependencias:
	```bash
	cd backend
	pip install -r requirements.txt
	```

2. Configura variables de entorno:
	- `MONGO_URL`: URL de tu base de datos MongoDB
	- `DB_NAME`: Nombre de la base de datos
	- `STRIPE_SECRET_KEY`: Clave secreta de Stripe
	- `OPENAI_API_KEY`: Clave de OpenAI
	- `ALLOWED_ORIGINS`: Dominios permitidos para CORS (por defecto solo https://agoramujeres.com)

3. Ejecuta el servidor:
	```bash
	uvicorn backend.server:app --reload --port 8000
	```

4. Accede a la documentación interactiva:
	```
	http://localhost:8000/docs
	```

### Frontend

1. Instala dependencias:
	```bash
	cd frontend
	npm install
	```

2. Inicia el desarrollo:
	```bash
	npm start
	```

3. Presiona `w` para web, `a` para Android, o `i` para iOS

---

## 🔐 Optimización y Seguridad

- ✅ CORS restringido a dominios seguros
- ✅ Stripe y OpenAI protegidos por variables de entorno
- ✅ Datos sensibles nunca expuestos en logs
- ✅ Validación de datos con Pydantic
- ✅ Autenticación via Firebase
- ✅ Pruebas automatizadas incluidas
- ✅ Hot reload en desarrollo para iteración rápida

## 🧪 Pruebas

Ejecuta:
```bash
python backend_test.py
python final_api_test.py
```

Verifica resultados en `test_result.md`

---

## 📊 Estadísticas del Proyecto

- **Backend**: ~8 routers, ~50+ endpoints REST
- **Frontend**: ~15 pantallas
- **Lenguajes**: Python (backend) + TypeScript (frontend)
- **Dependencias**: 30+ (backend) + 50+ (frontend)
- **Versión**: 2.0.0 (Abril 2026)
- **Autoría**: 98.2% código propio

---

## 📝 Notas de Desarrollo

Este proyecto demuestra mejores prácticas en:
- Separación de responsabilidades (Backend/Frontend desacoplados)
- Abstracción de dependencias (Adapter Pattern para LLM)
- Modularidad (Routers por dominio)
- Seguridad (Env variables, CORS, Firebase)
- Multiplataforma (Expo para iOS, Android, Web)
- TypeScript para frontend (mejor robustez)
- Async/Await en backend (mejor rendimiento)
