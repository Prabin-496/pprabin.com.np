#!/usr/bin/env bash
# Run on EC2 as ec2-user after rsync of backend to ~/voice-ai-api
set -euo pipefail

APP_DIR="${HOME}/voice-ai-api"
NGINX_CONF_SRC="${APP_DIR}/deploy/voice-ai/nginx-voice-ai.conf"

echo "==> Installing Node 20, nginx, PM2..."
sudo dnf install -y nginx
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
sudo npm install -g pm2

echo "==> Installing app dependencies..."
cd "${APP_DIR}"
npm ci --omit=dev

mkdir -p "${APP_DIR}/voice-ai-data/audio"

if [[ ! -f "${APP_DIR}/.env" ]]; then
  echo "WARN: Create ${APP_DIR}/.env from .env.example (GEMINI_API_KEY required)"
  cp .env.example .env
fi

echo "==> PM2..."
pm2 delete voice-ai-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH="${PATH}:/usr/bin" pm2 startup systemd -u ec2-user --hp "${HOME}" || true

echo "==> Nginx..."
sudo cp "${NGINX_CONF_SRC}" /etc/nginx/conf.d/voice-ai.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl reload nginx

echo "==> Health check..."
sleep 2
curl -sf "http://127.0.0.1:4100/health" | head -c 200
echo ""
curl -sf "http://127.0.0.1/health" | head -c 200
echo ""
echo "Done. Set GEMINI_API_KEY in ${APP_DIR}/.env then: pm2 restart voice-ai-api"
