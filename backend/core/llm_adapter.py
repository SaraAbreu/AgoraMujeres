"""
LLM Adapter - Capa de abstracción propia que encapsula las dependencias de LLM

Este módulo proporciona una interfaz consistente para interactuar con proveedores de LLM.
Inicialmente utiliza OpenAI, pero puede reemplazarse fácilmente con otro
proveedor (Anthropic, etc.) sin cambiar el código que lo utiliza.

Esto es código PROPIO que abstrae la complejidad de las dependencias externas.
"""

import os
import logging
from typing import List, Dict, Any, Optional

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

logger = logging.getLogger(__name__)


class UserMessage:
    """Representación de un mensaje de usuario."""
    def __init__(self, content: str):
        self.content = content


class MyLLMInterface:
    """
    Interfaz unificada para interactuar con LLM providers (OpenAI, etc).
    
    Esta clase encapsula la lógica de OpenAI permitiendo:
    - Abstraer la dependencia de OpenAI
    - Facilitar cambios futuros a otros proveedores de LLM
    - Mantener una interfaz consistente
    
    Uso:
        llm = MyLLMInterface(api_key="sk-xxx", system_message="Eres un asistente...")
        llm.set_model("openai", "gpt-4o-mini")
        response = await llm.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Hola"}]
        )
    """
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        session_id: Optional[str] = None,
        system_message: Optional[str] = None,
        engine: Optional[str] = None
    ):
        """
        Inicializa la interfaz de LLM.
        
        Args:
            api_key: Clave API (por defecto desde OPENAI_API_KEY)
            session_id: ID de sesión para tracking
            system_message: Mensaje del sistema/prompt
            engine: Motor a usar ('openai' o similar)
        """
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        self.session_id = session_id
        self.system_message = system_message or ""
        self.engine = engine or "openai"
        self.model = "gpt-4o-mini"
        self.messages: List[Dict[str, str]] = []
        self._client = None

        # LOG explícito para depuración
        print(f"[LLM-DEBUG] Inicializando MyLLMInterface")
        print(f"[LLM-DEBUG] api_key: {'PRESENTE' if self.api_key else 'NO DEFINIDA'} (longitud: {len(self.api_key) if self.api_key else 0})")
        print(f"[LLM-DEBUG] OpenAI importado: {'sí' if OpenAI else 'no'}")

        # Inicializar cliente si es posible
        if self.api_key and OpenAI:
            try:
                self._client = OpenAI(api_key=self.api_key)
                logger.info("OpenAI client initialized successfully")
                print("[LLM-DEBUG] Cliente OpenAI inicializado correctamente")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                print(f"[LLM-DEBUG] Error al inicializar cliente OpenAI: {e}")
                self._client = None
    
    @property
    def client(self):
        """Acceso directo al cliente de OpenAI."""
        if not self._client:
            if not self.api_key:
                raise RuntimeError("OpenAI API key not configured")
            if not OpenAI:
                raise RuntimeError("OpenAI library not installed")
            self._client = OpenAI(api_key=self.api_key)
        return self._client
    
    def set_model(self, provider: str, model: str) -> 'MyLLMInterface':
        """
        Configura el modelo y proveedor a usar.
        
        Args:
            provider: Proveedor ('openai' o similar)
            model: Nombre del modelo (ej: 'gpt-4o-mini')
            
        Returns:
            self para encadenamiento de métodos
        """
        self.engine = provider
        self.model = model
        logger.info(f"Model set to {provider}/{model}")
        return self
    
    def add_message(self, role: str, content: str) -> None:
        """
        Añade un mensaje al historial de la conversación.
        
        Args:
            role: 'user', 'assistant', o 'system'
            content: Contenido del mensaje
        """
        self.messages.append({
            "role": role,
            "content": content
        })
    
    def get_messages(self) -> List[Dict[str, str]]:
        """
        Obtiene el historial de mensajes.
        
        Returns:
            Lista de mensajes de la conversación
        """
        return self.messages.copy()
    
    def clear_messages(self) -> None:
        """Limpia el historial de mensajes."""
        self.messages = []
