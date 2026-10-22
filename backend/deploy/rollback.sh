#!/bin/bash
# ══════════════════════════════════════════════════════════
# USAM Hub — Rollback Script
# ══════════════════════════════════════════════════════════

set -e
APP_DIR="/var/www/usam-hub"

echo "Recent commits:"
cd $APP_DIR
git log --oneline -10

echo ""
read -p "Enter commit hash to rollback to: " COMMIT_HASH

git checkout $COMMIT_HASH

cd $APP_DIR/backend/backend
npm ci --omit=dev

# Undo last migration if needed (optional)
# npx sequelize-cli db:migrate:undo

pm2 reload usam-hub-api

echo "✅ Rolled back to $COMMIT_HASH"
