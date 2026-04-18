#!/bin/bash
# ══════════════════════════════════════════════════════════
# USAM Hub — SSL Certificate Setup (Let's Encrypt)
# ══════════════════════════════════════════════════════════

set -e
DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"

echo "Setting up SSL for $DOMAIN..."

# Install certbot if not present
apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx \
  --non-interactive \
  --agree-tos \
  --email $EMAIL \
  --domains $DOMAIN,www.$DOMAIN \
  --redirect

# Auto-renewal cron job
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && systemctl reload nginx") | crontab -

echo "✅ SSL configured for $DOMAIN"
echo "Auto-renewal cron job added."
