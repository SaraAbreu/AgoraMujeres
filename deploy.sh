#!/bin/bash
echo "Desplegando Agora Mujeres..."
cd ~/AgoraMujeres/frontend
npx expo export --platform web
sed -i 's|</head>|<link rel="manifest" href="/manifest.json"><meta name="theme-color" content="#2C3D2E"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Agora"><link rel="apple-touch-icon" href="/logo-silueta.png"></head>|' ~/AgoraMujeres/frontend/dist/index.html
rsync -avz --delete ~/AgoraMujeres/frontend/dist/ root@217.154.186.186:/var/www/agora-frontend/
rsync -avz ~/AgoraMujeres/backend/ root@217.154.186.186:/var/www/agora-backend/ --exclude venv --exclude __pycache__ --exclude .env
ssh root@217.154.186.186 "pkill -f uvicorn; sleep 2; cd /var/www/agora-backend && nohup /var/www/agora-backend/venv/bin/python3 -m uvicorn server:app --host 127.0.0.1 --port 8001 > /var/log/agora.log 2>&1 &"
echo "Deploy completado"
