#!/bin/bash
set -e

SERVER="root@217.154.186.186"
APP_DIR="$HOME/AgoraMujeres/app-agora"
BACKEND_DIR="$HOME/AgoraMujeres/backend"

echo "🔨 Compilando frontend..."
cd "$APP_DIR"
npx expo export --platform web

echo "🚀 Subiendo frontend al servidor..."
rsync -avz --delete "$APP_DIR/dist/" "$SERVER:/var/www/agora-frontend/"

echo "🔄 Subiendo backend al servidor..."
rsync -avz "$BACKEND_DIR/" "$SERVER:/var/www/agora-backend/" \
  --exclude venv \
  --exclude __pycache__ \
  --exclude .env \
  --exclude "*.pyc"

echo "♻️  Reiniciando backend..."
ssh "$SERVER" "pkill -f uvicorn; sleep 2; cd /var/www/agora-backend && nohup /var/www/agora-backend/venv/bin/python3 -m uvicorn server:app --host 127.0.0.1 --port 8001 > /var/log/agora.log 2>&1 &"

echo ""
echo "✅ Deploy completado — https://agoramujeres.syntexia-solutions.es"
