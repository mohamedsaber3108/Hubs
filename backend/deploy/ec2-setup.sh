#!/bin/bash
# ══════════════════════════════════════════════════════════
# USAM Hub — EC2 Server Bootstrap Script
# Ubuntu 22.04 LTS | Node.js v20 | Nginx | PM2 | Redis
# Run: chmod +x ec2-setup.sh && sudo bash ec2-setup.sh
# ══════════════════════════════════════════════════════════

set -e
REPO_URL="https://github.com/Mahmoud-Elwazeer/hub.git"
APP_DIR="/var/www/usam-hub"
# Backend is nested at backend/backend in this repo.
BACKEND_DIR="$APP_DIR/backend/backend"
DOMAIN="hub.usamif.com"

echo "═══════════════════════════════════════"
echo "  USAM Hub — EC2 Setup Starting"
echo "═══════════════════════════════════════"

# Update system
apt-get update -y && apt-get upgrade -y

# Install essentials
apt-get install -y curl git build-essential unzip software-properties-common

# Install Node.js v20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version && npm --version

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt-get install -y nginx
systemctl enable nginx

# Install Redis
apt-get install -y redis-server
systemctl enable redis-server
# Secure Redis: require password
sed -i 's/# requirepass foobared/requirepass CHANGE_REDIS_PASSWORD/' /etc/redis/redis.conf
systemctl restart redis-server

# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Configure UFW firewall
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
echo "UFW configured"

# Create app directory
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
if [ -d ".git" ]; then
  git pull origin main
else
  git clone $REPO_URL .
fi

# Install backend dependencies (backend is nested at backend/backend)
cd $BACKEND_DIR
npm ci --omit=dev

# Build frontend
cd $APP_DIR/frontend
npm install
npm run build

# Copy frontend build to nginx web root
mkdir -p /var/www/html/usam-hub
cp -r dist/* /var/www/html/usam-hub/

# Copy nginx config (deploy kit lives at backend/deploy in the repo)
cp $APP_DIR/backend/deploy/nginx.conf /etc/nginx/sites-available/hub.usamif.com
ln -sf /etc/nginx/sites-available/hub.usamif.com /etc/nginx/sites-enabled/hub.usamif.com
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t && systemctl reload nginx

# Copy .env template (fill with REAL values; never commit)
cp $BACKEND_DIR/.env.example $BACKEND_DIR/.env
echo ""
echo "⚠️  IMPORTANT: Edit $BACKEND_DIR/.env with your real values (RDS, Redis pw, JWT secrets, SES sender)!"
echo ""

# Run database migrations and structural seeds.
# NOTE: with NODE_ENV=production the admin + demo-user seeders self-skip, so
# this loads only structural data (communities/settings/pricing/templates) —
# never demo users or a fixed-credential default admin.
cd $BACKEND_DIR
NODE_ENV=production npx sequelize-cli db:migrate
NODE_ENV=production npx sequelize-cli db:seed:all

echo ""
echo "⚠️  Provision the initial super-admin explicitly before using the admin portal:"
echo "    cd $BACKEND_DIR && INITIAL_ADMIN_EMAIL=you@domain \\"
echo "      INITIAL_ADMIN_PASSWORD='<strong>' NODE_ENV=production npm run provision:admin"
echo ""

# Start with PM2 (app name: usam-hub-api; config at backend/deploy)
pm2 start $APP_DIR/backend/deploy/pm2.config.js
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

echo ""
echo "═══════════════════════════════════════"
echo "  ✅ USAM Hub Setup Complete!"
echo "  Next: Run ssl-setup.sh for HTTPS"
echo "═══════════════════════════════════════"
