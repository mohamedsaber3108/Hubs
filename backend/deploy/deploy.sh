#!/bin/bash
# ══════════════════════════════════════════════════════════
# USAM Hub — One-Command Deploy Script (Zero Downtime)
# ══════════════════════════════════════════════════════════

set -e
APP_DIR="/var/www/usam-hub"

echo "🚀 USAM Hub Deploying..."

cd $APP_DIR

# Pull latest code (release branch)
git pull

# Backend (nested at backend/backend)
cd $APP_DIR/backend/backend
npm ci --omit=dev

# Run any new migrations
NODE_ENV=production npx sequelize-cli db:migrate

# Frontend: prefer a CI-built dist artifact; fall back to local build only if absent.
# (Build-in-CI avoids OOM on the 3.7GB box.)
if [ -d "$APP_DIR/frontend/dist" ]; then
  cp -r $APP_DIR/frontend/dist/* /var/www/html/usam-hub/
else
  cd $APP_DIR/frontend && npm ci && npm run build && cp -r dist/* /var/www/html/usam-hub/
fi

# PM2 zero-downtime reload
pm2 reload usam-hub-api

# Nginx test + reload
nginx -t && systemctl reload nginx

echo "✅ Deploy complete! $(date)"
