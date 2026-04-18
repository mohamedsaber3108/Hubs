#!/bin/bash
# ══════════════════════════════════════════════════════════
# USAM Hub — One-Command Deploy Script (Zero Downtime)
# ══════════════════════════════════════════════════════════

set -e
APP_DIR="/var/www/usam-hub"

echo "🚀 USAM Hub Deploying..."

cd $APP_DIR

# Pull latest code
git pull origin main

# Backend
cd $APP_DIR/backend
npm install --production

# Run any new migrations
npx sequelize-cli db:migrate

# Frontend build
cd $APP_DIR/frontend
npm install
npm run build
cp -r dist/* /var/www/html/usam-hub/

# PM2 zero-downtime reload
pm2 reload usam-hub-api

# Nginx test + reload
nginx -t && systemctl reload nginx

echo "✅ Deploy complete! $(date)"
