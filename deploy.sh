#!/bin/bash
set -e

SERVER="root@217.154.186.186"
APP_DIR="$HOME/AgoraMujeres/app-agora"
BACKEND_DIR="$HOME/AgoraMujeres/backend"
FRONTEND_DOCROOT="/var/www/vhosts/agoramujeres.syntexia-solutions.es/httpdocs"

echo "🔨 Compilando frontend..."
cd "$APP_DIR"
npx expo export --platform web

echo "🚀 Subiendo frontend al servidor (docroot real de Apache)..."
ssh "$SERVER" "rm -rf $FRONTEND_DOCROOT/*"
tar -czf - -C "$APP_DIR/dist" . | ssh "$SERVER" "tar xzf - -C $FRONTEND_DOCROOT && chown -R www-data:www-data $FRONTEND_DOCROOT"

echo "🔄 Subiendo backend al servidor..."
tar --exclude=venv --exclude=__pycache__ --exclude=.env --exclude="*.pyc" \
  -czf - -C "$BACKEND_DIR" . | ssh "$SERVER" "tar xzf - -C /var/www/AgoraMujeres/backend"

echo "♻️  Reiniciando backend (systemd)..."
ssh "$SERVER" "systemctl restart agora-backend"

echo ""
echo "✅ Deploy completado — https://agoramujeres.syntexia-solutions.es"
