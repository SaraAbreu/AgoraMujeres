"""Mock API server for development without MongoDB"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json

app = FastAPI(title="Ágora Mujeres Mock API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Demo resources data
DEMO_RESOURCES_ES = [
    {
        "id": "breathing_1",
        "category": "breathing",
        "type": "article",
        "title": "Respiración abdominal para el dolor",
        "description": "Técnica sencilla de 5 minutos para calmar el dolor y la ansiedad",
        "content": "La respiración abdominal profunda es una técnica comprobada para reducir el dolor crónico...",
        "author": "Dra. María López",
        "author_credentials": "Especialista en dolor crónico",
        "read_time": "5 min",
        "is_featured": True,
        "language": "es"
    },
    {
        "id": "breathing_2",
        "category": "breathing",
        "type": "video",
        "title": "Técnica de respiración 4-7-8 para fibromialgia",
        "description": "Guía paso a paso de la técnica de respiración 4-7-8 que ayuda a reducir la tensión muscular",
        "video_url": "https://www.youtube.com/watch?v=example",
        "author": "Coach de bienestar",
        "duration": "10 min",
        "is_featured": False,
        "language": "es"
    },
    {
        "id": "stretching_1",
        "category": "stretching",
        "type": "article",
        "title": "Estiramientos suaves para fibromialgia",
        "description": "Guía de 10 estiramientos que puedes hacer sin agravar el dolor",
        "content": "Los estiramientos específicos pueden mejorar significativamente tu flexibilidad sin exacerbar los síntomas...",
        "author": "Fisioterapeuta Juan García",
        "read_time": "8 min",
        "is_featured": True,
        "language": "es"
    },
    {
        "id": "stretching_2",
        "category": "stretching",
        "type": "article",
        "title": "Puntos gatillo: Cómo automásajarte en casa",
        "description": "Técnicas de auto-masaje para aliviar puntos de dolor muscular",
        "content": "Identificar y trabajar con tus puntos gatillo puede ser una herramienta poderosa de manejo del dolor...",
        "author": "Terapeuta de masaje especializado",
        "read_time": "10 min",
        "is_featured": False,
        "language": "es"
    },
    {
        "id": "nutrition_1",
        "category": "nutrition",
        "type": "article",
        "title": "Alimentos antiinflamatorios para fibromialgia",
        "description": "Lista de alimentos que ayudan a reducir la inflamación",
        "content": "Una dieta antiinflamatoria puede significativamente mejorar los síntomas de la fibromialgia...",
        "author": "Nutricionista Ana Rodríguez",
        "read_time": "10 min",
        "is_featured": True,
        "language": "es"
    },
    {
        "id": "nutrition_2",
        "category": "nutrition",
        "type": "article",
        "title": "Recetas fáciles y nutritivas para días difíciles",
        "description": "Comidas simples que no requieren mucho esfuerzo pero son nutricionalmente densas",
        "content": "Cuando el dolor y la fatiga son altos, es importante tener recetas que requieran mínimo esfuerzo...",
        "author": "Chef especializado en salud",
        "read_time": "12 min",
        "is_featured": False,
        "language": "es"
    },
    {
        "id": "sleep_1",
        "category": "sleep",
        "type": "article",
        "title": "Guía de higiene del sueño para fibromialgia",
        "description": "Consejos prácticos para mejorar la calidad del sueño con fibromialgia",
        "content": "El sueño reparador es especialmente importante para las personas con fibromialgia...",
        "author": "Especialista en medicina del sueño",
        "read_time": "9 min",
        "is_featured": True,
        "language": "es"
    },
    {
        "id": "sleep_2",
        "category": "sleep",
        "type": "video",
        "title": "Rutina nocturna de 10 minutos para dormir mejor",
        "description": "Prepara tu cuerpo para dormir mejor con esta rutina relajante",
        "video_url": "https://www.youtube.com/watch?v=sleep",
        "author": "Coach de sueño",
        "duration": "10 min",
        "is_featured": False,
        "language": "es"
    },
    {
        "id": "mindfulness_1",
        "category": "mindfulness",
        "type": "article",
        "title": "Meditación guiada para el dolor crónico",
        "description": "Cómo usar mindfulness para cambiar tu relación con el dolor",
        "content": "La meditación mindfulness ha demostrado reducir la percepción del dolor en fibromialgia...",
        "author": "Psicóloga clínica y meditadora certificada",
        "read_time": "7 min",
        "is_featured": True,
        "language": "es"
    },
    {
        "id": "mindfulness_2",
        "category": "mindfulness",
        "type": "article",
        "title": "Body scan para aliviar tensión muscular",
        "description": "Técnica de escaneo corporal que reduce la tensión y aumenta la conciencia",
        "content": "El body scan es una práctica que te ayuda a identificar dónde guardas tensión...",
        "author": "Instructor de mindfulness",
        "read_time": "6 min",
        "is_featured": False,
        "language": "es"
    },
    {
        "id": "professional_1",
        "category": "professional",
        "type": "article",
        "title": "Qué esperar en una consulta con especialista",
        "description": "Guía para prepararte para tu próxima cita médica",
        "content": "Una buena comunicación con tu médico es clave. Aquí te mostramos cómo prepararte...",
        "author": "Dra. Especialista en fibromialgia",
        "read_time": "6 min",
        "is_featured": True,
        "language": "es"
    },
    {
        "id": "professional_2",
        "category": "professional",
        "type": "article",
        "title": "Síntomas de fibromialgia: Lo que investigadores descubrieron",
        "description": "Resumen actualizado de la investigación sobre fibromialgia",
        "content": "Aunque la fibromialgia se diagnosticó hace décadas, la investigación reciente sigue revelando...",
        "author": "Dr. Investigador de fibromialgia",
        "read_time": "11 min",
        "is_featured": False,
        "language": "es"
    }
]

DEMO_RESOURCES_EN = [
    {
        "id": "breathing_1",
        "category": "breathing",
        "type": "article",
        "title": "Abdominal breathing for pain relief",
        "description": "Simple 5-minute technique to calm pain and anxiety",
        "content": "Deep abdominal breathing is a proven technique for chronic pain reduction...",
        "author": "Dr. John Smith",
        "author_credentials": "Chronic pain specialist",
        "read_time": "5 min",
        "is_featured": True,
        "language": "en"
    },
    {
        "id": "stretching_1",
        "category": "stretching",
        "type": "article",
        "title": "Gentle stretches for fibromyalgia",
        "description": "Guide to 10 stretches you can do without worsening pain",
        "content": "Specific stretches can significantly improve your flexibility without exacerbating symptoms...",
        "author": "Physical Therapist James Wilson",
        "read_time": "8 min",
        "is_featured": True,
        "language": "en"
    },
    {
        "id": "nutrition_1",
        "category": "nutrition",
        "type": "article",
        "title": "Anti-inflammatory foods for fibromyalgia",
        "description": "List of foods that help reduce inflammation",
        "content": "An anti-inflammatory diet can significantly improve fibromyalgia symptoms...",
        "author": "Nutritionist Sarah Brown",
        "read_time": "10 min",
        "is_featured": True,
        "language": "en"
    },
    {
        "id": "sleep_1",
        "category": "sleep",
        "type": "article",
        "title": "Sleep hygiene guide for fibromyalgia",
        "description": "Practical tips to improve sleep quality with fibromyalgia",
        "content": "Restorative sleep is especially important for people with fibromyalgia...",
        "author": "Sleep medicine specialist",
        "read_time": "9 min",
        "is_featured": True,
        "language": "en"
    },
    {
        "id": "mindfulness_1",
        "category": "mindfulness",
        "type": "article",
        "title": "Guided meditation for chronic pain",
        "description": "How to use mindfulness to change your relationship with pain",
        "content": "Mindfulness meditation has shown to reduce pain perception in fibromyalgia...",
        "author": "Clinical psychologist and certified meditator",
        "read_time": "7 min",
        "is_featured": True,
        "language": "en"
    },
    {
        "id": "professional_1",
        "category": "professional",
        "type": "article",
        "title": "What to expect at a specialist appointment",
        "description": "Guide to prepare for your next medical visit",
        "content": "Good communication with your doctor is key. Here's how to prepare...",
        "author": "Fibromyalgia specialist MD",
        "read_time": "6 min",
        "is_featured": True,
        "language": "en"
    },
]

# Models
class ChatMessage(BaseModel):
    role: str
    content: str
    deviceId: Optional[str] = None

class ChatResponse(BaseModel):
    role: str
    content: str

# Routes
@app.get("/health")
async def health():
    return {"status": "ok", "service": "agora-mock"}

@app.get("/api/resources")
async def get_resources(category: Optional[str] = None, language: str = "es", limit: int = 50):
    """Get resources"""
    data = DEMO_RESOURCES_ES if language == "es" else DEMO_RESOURCES_EN
    
    if category:
        data = [r for r in data if r["category"] == category]
    
    return data[:limit]

@app.get("/api/resources/categories")
async def get_categories(language: str = "es"):
    """Get resource categories"""
    categories = {
        "es": [
            {"id": "breathing", "name": "Respiración", "icon": "🫁", "count": 2},
            {"id": "stretching", "name": "Estiramientos", "icon": "🧘", "count": 2},
            {"id": "nutrition", "name": "Nutrición", "icon": "🥗", "count": 2},
            {"id": "sleep", "name": "Sueño", "icon": "😴", "count": 2},
            {"id": "mindfulness", "name": "Mindfulness", "icon": "🧠", "count": 2},
            {"id": "professional", "name": "Profesional", "icon": "👨‍⚕️", "count": 2},
        ],
        "en": [
            {"id": "breathing", "name": "Breathing", "icon": "🫁", "count": 1},
            {"id": "stretching", "name": "Stretching", "icon": "🧘", "count": 1},
            {"id": "nutrition", "name": "Nutrition", "icon": "🥗", "count": 1},
            {"id": "sleep", "name": "Sleep", "icon": "😴", "count": 1},
            {"id": "mindfulness", "name": "Mindfulness", "icon": "🧠", "count": 1},
            {"id": "professional", "name": "Professional", "icon": "👨‍⚕️", "count": 1},
        ]
    }
    return categories.get(language, categories["en"])

@app.post("/api/chat")
async def chat(message: ChatMessage):
    """Chat endpoint - returns Ágora's response"""
    user_content = message.content.lower()
    
    # Simple keyword-based responses
    responses = {
        "es": {
            "dolor": "Entiendo que tienes mucho dolor. La respiración profunda y los estiramientos suaves pueden ayudar. ¿Quieres que compartamos algunas técnicas?",
            "cansancio": "La fatiga en la fibromialgia es muy real. Descansar adecuadamente y hacer actividad suave puede mejorar tu energía. ¿Qué te ha ayudado antes?",
            "dormir": "El sueño es crucial para tu bienestar. Tenemos varias técnicas de relajación que podrían ayudarte a dormir mejor.",
            "ayuda": "Estoy aquí para apoyarte. Recuerda que siempre puedes contactar a un profesional de salud si es urgente.",
            "default": "Gracias por compartir conmigo. Estoy aquí para escuchar y apoyarte en tu camino hacia el bienestar."
        },
        "en": {
            "pain": "I understand you're experiencing pain. Deep breathing and gentle stretching can help. Would you like some techniques?",
            "tired": "Fatigue in fibromyalgia is very real. Proper rest and gentle activity can boost your energy. What has helped before?",
            "sleep": "Sleep is crucial for your wellbeing. We have several relaxation techniques that could help you sleep better.",
            "help": "I'm here to support you. Remember, you can always contact a healthcare professional if it's urgent.",
            "default": "Thank you for sharing with me. I'm here to listen and support you on your wellness journey."
        }
    }
    
    lang = "es" if "dolor" in user_content or "cansancio" in user_content else "en"
    lang_responses = responses.get(lang, responses["en"])
    
    # Find matching response
    response_text = lang_responses["default"]
    for key, value in lang_responses.items():
        if key != "default" and key in user_content:
            response_text = value
            break
    
    return ChatResponse(role="assistant", content=response_text)

# Run: uvicorn mock_server:app --reload --host 0.0.0.0 --port 5000
