import os
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI  # La línea amarilla debería desaparecer ahora

logger = logging.getLogger(__name__)

# En llm_adapter.py
class MyLLMInterface:
    def __init__(self, api_key: Optional[str] = None, system_message: Optional[str] = None, **kwargs):
        # El **kwargs hace que acepte 'session_id' sin romperse
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        self.base_prompt = system_message or ""
        # ... resto del código igual ...
        # 1. Buscamos la clave API (prioridad parámetro > entorno)
        self.api_key = api_key or os.environ.get('OPENAI_API_KEY')
        
        # 2. Guardamos el prompt de agora_content.py como plantilla base
        self.base_system_prompt = system_message or ""
        
        self.model = "gpt-4o-mini"
        self.messages: List[Dict[str, str]] = []
        self._client = None

        if self.api_key:
            try:
                # Inicialización correcta para OpenAI v1.0+
                self._client = OpenAI(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Error al inicializar OpenAI: {e}")

    def _prepare_dynamic_prompt(self, context: Dict[str, Any]) -> str:
        """Sustituye los placeholders de agora_content.py por datos reales."""
        prompt = self.base_system_prompt
        # Valores por defecto cariñosos por si el contexto viene vacío
        replacements = {
            "{preferred_name}": context.get("name", "amiga"),
            "{recent_emotions}": context.get("emotions", "calma"),
            "{recent_symptoms}": context.get("symptoms", "estables"),
            "{recent_patterns}": context.get("patterns", "sin cambios detectados")
        }
        for key, value in replacements.items():
            prompt = prompt.replace(key, str(value))
        return prompt

    async def generate_response(self, user_input: str, context_data: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """Genera la respuesta. Si falla, devuelve None para activar el fallback básico."""
        if not self._client:
            logger.error("Cliente OpenAI no disponible.")
            return None

        try:
            # 1. Personalizamos el prompt del sistema con la calidez de Ágora
            system_content = self._prepare_dynamic_prompt(context_data or {})
            
            # 2. Construimos la lista de mensajes (System + Historial + Nuevo Mensaje)
            api_messages = [{"role": "system", "content": system_content}]
            api_messages.extend(self.messages[-10:]) # Últimos 10 mensajes para tener memoria
            api_messages.append({"role": "user", "content": user_input})

            # 3. LLAMADA CORRECTA (v1.0+ SIN await interno)
            # Aunque la función es async, el cliente de OpenAI es directo
            response = self._client.chat.completions.create(
                model=self.model,
                messages=api_messages,
                temperature=0.7,
                max_tokens=500
            )

            answer = response.choices[0].message.content

            # 4. Guardamos en el historial interno para que Ágora recuerde la charla
            self.add_message("user", user_input)
            self.add_message("assistant", answer)

            return answer

        except Exception as e:
            logger.error(f"Error en comunicación con OpenAI: {e}")
            return None # Esto dispara el fallback básico en tu server.py

    def add_message(self, role: str, content: str) -> None:
        self.messages.append({"role": role, "content": content})

    def clear_history(self):
        self.messages = []