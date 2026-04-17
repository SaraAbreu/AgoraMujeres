# scripts/seguridad_ci.sh
# Ejecuta escaneo de vulnerabilidades en backend y frontend

# Backend: Python (safety)
echo "--- Escaneo de dependencias Python (backend) ---"
pip install --quiet safety
safety check -r backend/requirements.txt || exit 1

# Frontend: Node.js (npm audit)
echo "--- Escaneo de dependencias Node.js (frontend) ---"
cd app-agora
npm install --quiet
npm audit --audit-level=high || exit 1

echo "Escaneo de seguridad completado."
