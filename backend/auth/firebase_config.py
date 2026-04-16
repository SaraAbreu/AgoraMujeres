from flask import request, jsonify
import firebase_admin
from firebase_admin import auth as firebase_auth

# Asegúrate de que el Blueprint (auth_bp) esté definido arriba o importado
@auth_bp.route('/google', methods=['POST'])
def google_login():
    data = request.get_json()
    id_token = data.get('token') # El frontend debe enviar esto
    
    if not id_token:
        return jsonify({"error": "Falta el token de Google"}), 422 # Aquí daría el error si no llega

    try:
        # Verificamos el token con la librería que ya tienes importada
        decoded_token = firebase_auth.verify_id_token(id_token)
        email = decoded_token['email']
        
        # Si todo ok, devolvemos el acceso
        return jsonify({
            "status": "success",
            "user": {"email": email}
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 401