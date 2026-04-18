#!/bin/bash
# ══════════════════════════════════════════════════════════
# USAM Hub — EC2 Server Bootstrap Script
# Ubuntu 22.04 LTS | Node.js v20 | Nginx | PM2 | Redis
# Run: chmod +x ec2-setup.sh && sudo bash ec2-setup.sh
# ══════════════════════════════════════════════════════════

set -e
REPO_URL="https://github.com/YOUR_ORG/usam-hub.git"
APP_DIR="/var/www/usam-hub"
DOMAIN="yourdomain.com"

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

# Install backend dependencies
cd $APP_DIR/backend
npm install --production

# Build frontend
cd $APP_DIR/frontend
npm install
npm run build

# Copy frontend build to nginx web root
mkdir -p /var/www/html/usam-hub
cp -r dist/* /var/www/html/usam-hub/

# Copy nginx config
cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/usam-hub
ln -sf /etc/nginx/sites-available/usam-hub /etc/nginx/sites-enabled/usam-hub
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t && systemctl reload nginx

# Copy .env
cp $APP_DIR/backend/.env.example $APP_DIR/backend/.env
echo ""
echo "⚠️  IMPORTANT: Edit /var/www/usam-hub/backend/.env with your real values!"
echo ""

# Run database migrations and seeds
cd $APP_DIR/backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Start with PM2
pm2 start $APP_DIR/deploy/pm2.config.js
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

echo ""
echo "═══════════════════════════════════════"
echo "  ✅ USAM Hub Setup Complete!"
echo "  Next: Run ssl-setup.sh for HTTPS"
echo "═══════════════════════════════════════"
