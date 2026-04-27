from flask import Blueprint, request, jsonify
from datetime import datetime
import math

# Definimos el blueprint
ciclo_bp = Blueprint('ciclo', __name__)

@ciclo_bp.route('/api/ciclo', methods=['POST'])
def registrar_ciclo():
    data = request.get_json()
    
    # 1. Extraemos los datos que vienen del frontend
    inicio_str = data.get('inicio')
    duracion = data.get('duracion', 28)
    es_menopausia = data.get('menopausia', False)
    sintomas = data.get('sintomas', [])
    notas = data.get('notas', '')

    # --- CASO 1: MUJER EN MENOPAUSIA ---
    if es_menopausia:
        return jsonify({
            "status": "success",
            "data": {
                "fase": "PLENITUD",
                "dia_actual": None,
                "color": "#8B5A2B",
                "consejo": "Etapa de sabiduría. Tu cuerpo prioriza la calma y el autocuidado profundo.",
                "mensaje_ajustes": "Santuario en etapa de Plenitud"
            }
        }), 200

    # --- CASO 2: CICLO HORMONAL ACTIVO ---
    try:
        # Convertimos la fecha de inicio (ISO format) a objeto datetime
        # Manejamos el formato Z o el offset +00:00
        fecha_inicio = datetime.fromisoformat(inicio_str.replace('Z', '+00:00'))
        hoy = datetime.now(fecha_inicio.tzinfo)
        
        # Calculamos cuántos días han pasado
        diferencia = hoy - fecha_inicio
        dias_transcurridos = diferencia.days
        
        # El día actual dentro del ciclo (ej: día 12 de 28)
        dia_actual = (dias_transcurridos % duracion) + 1

        # Determinamos la Fase y el Consejo según el día
        if 1 <= dia_actual <= 5:
            fase = "FASE MENSTRUAL"
            consejo = "Tiempo de soltar y renovar. Prioriza el descanso y alimentos calientes."
            color = "#C5A059" # Oro
        elif 6 <= dia_actual <= 12:
            fase = "FASE FOLICULAR"
            consejo = "Tu energía comienza a brotar. Momento ideal para planificar y crear."
            color = "#D1C4B2" # Beige
        elif 13 <= dia_actual <= 17:
            fase = "FASE OVULATORIA"
            consejo = "Máxima vitalidad y brillo. Tu poder de comunicación está en su punto más alto."
            color = "#E6D5B8" # Crema
        else:
            fase = "FASE LÚTEA"
            consejo = "Baja el ritmo. Tu cuerpo pide introspección y preparación para el nuevo ciclo."
            color = "#8B5A2B" # Tierra

        return jsonify({
            "status": "success",
            "data": {
                "dia_actual": dia_actual,
                "fase": fase,
                "consejo": consejo,
                "color": color,
                "duracion_total": duracion
            }
        }), 200

    except Exception as e:
        return jsonify({"error": f"Error procesando fechas: {str(e)}"}), 400