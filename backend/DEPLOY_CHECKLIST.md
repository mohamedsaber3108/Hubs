# USAM Hub — AWS Deploy Checklist

> Work through every section **top-to-bottom** before declaring the app live.
> Items marked 🔴 **MUST** be done before launch. Items marked 🟡 are strongly recommended.

---

## 0 · Prerequisites

| # | Item | Status |
|---|------|--------|
| 1 | AWS account created and billing alerts configured | ☐ |
| 2 | AWS CLI installed and `aws configure` done (us-east-1) | ☐ |
| 3 | Domain purchased (Hostinger or Route53) | ☐ |
| 4 | GitHub repo created (backend + frontend in monorepo) | ☐ |
| 5 | Repository secrets configured (see §8 below) | ☐ |

---

## 1 · RDS — MySQL 8

### 1.1 Create the instance
```bash
# Console path: RDS → Create database → MySQL 8.0
# Recommended settings for t2.micro (Free Tier):
Instance class:  db.t3.micro
Storage:         20 GB gp2, auto-scaling off
Multi-AZ:        No  (enable in production after launch)
Public access:   No  (access only from EC2 security group)
DB name:         usam_hub
Username:        usam_user
Password:        <GENERATE — store in AWS Secrets Manager>
```

### 1.2 Security Group
- Allow port **3306** from EC2 security group only (never 0.0.0.0/0)

### 1.3 Run initialisation SQL
```bash
# From your local machine or EC2:
mysql -h <rds-endpoint> -u usam_user -p usam_hub < backend/rds-init.sql
```

### 1.4 Run migrations + structural seeds (NO demo data in production)
```bash
cd backend
NODE_ENV=production npx sequelize-cli db:migrate
# In production, the admin + demo-user seeders SELF-SKIP (they detect
# NODE_ENV=production and no-op), so db:seed:all only loads structural data
# (communities, settings, pricing plans, email templates) — never demo
# users or fixed-credential admins.
NODE_ENV=production npx sequelize-cli db:seed:all
```

🔴 **Provision the initial super-admin explicitly and securely** (there is NO
seeded default admin in production). Supply real credentials via env — the
password is bcrypt-hashed and never stored or logged in plaintext:
```bash
cd backend
INITIAL_ADMIN_EMAIL=you@yourdomain.com \
INITIAL_ADMIN_PASSWORD='<strong 12+ char password: lower/upper/number/symbol>' \
INITIAL_ADMIN_NAME='Platform Owner' \
NODE_ENV=production npm run provision:admin
# Idempotent: re-running reports "already exists" and changes nothing.
# Use `npm run provision:admin -- --force` to reset the password later.
```

---

## 2 · EC2 — Application Server

### 2.1 Launch instance
```
AMI:           Ubuntu 22.04 LTS
Instance type: t2.micro (Free Tier) — upgrade to t3.small after launch
Storage:       20 GB gp3
Key pair:      Create and download .pem — store securely
```

### 2.2 Security Group — EC2
| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22   | TCP      | Your IP only | SSH |
| 80   | TCP      | 0.0.0.0/0 | HTTP (nginx → HTTPS redirect) |
| 443  | TCP      | 0.0.0.0/0 | HTTPS |
| 3000 | TCP      | EC2 SG only | Backend (internal — never expose directly) |

### 2.3 Run the EC2 setup script
```bash
# SCP the script then run it
scp -i your-key.pem backend/ec2-setup.sh ubuntu@<EC2_IP>:~/
ssh -i your-key.pem ubuntu@<EC2_IP>
chmod +x ec2-setup.sh
./ec2-setup.sh    # installs Node 20, PM2, nginx, Redis, MySQL client
```

### 2.4 Clone the repo
```bash
cd /var/www
git clone https://github.com/YOUR_ORG/usam-hub.git
cd usam-hub/backend
npm ci --omit=dev
```

### 2.5 Create `.env` from template
```bash
cp .env.example .env
nano .env     # Fill every value — see §7 for complete reference
```

### 2.6 Start with PM2
```bash
# App name is `usam-hub-api`, config lives at deploy/pm2.config.js
pm2 start deploy/pm2.config.js --env production
pm2 save
pm2 startup     # follow the printed command to enable auto-start
```

---

## 3 · S3 — File Storage

### 3.1 Create buckets
```bash
# Public bucket for avatars, cover images, public resources
aws s3api create-bucket \
  --bucket usam-hub-storage \
  --region us-east-1

# Private bucket for resumes, private files
aws s3api create-bucket \
  --bucket usam-hub-private \
  --region us-east-1
```

### 3.2 Public bucket policy (usam-hub-storage)
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::usam-hub-storage/public/*"
  }]
}
```

### 3.3 CORS configuration (usam-hub-storage)
```json
[{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedOrigins": ["https://yourdomain.com"],
  "ExposeHeaders": ["ETag"]
}]
```

### 3.4 IAM user for the app
```bash
# Create a dedicated IAM user — never use root credentials
aws iam create-user --user-name usam-hub-app

# Attach inline policy
aws iam put-user-policy \
  --user-name usam-hub-app \
  --policy-name usam-hub-s3-ses \
  --policy-document file://iam-policy.json

# Create access keys
aws iam create-access-key --user-name usam-hub-app
# → copy AccessKeyId + SecretAccessKey into .env
```

**Minimum IAM policy (`iam-policy.json`):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject","s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::usam-hub-storage",
        "arn:aws:s3:::usam-hub-storage/*",
        "arn:aws:s3:::usam-hub-private",
        "arn:aws:s3:::usam-hub-private/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail","ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

---

## 4 · SES — Transactional Email

### 4.1 Verify your sending domain
```bash
# Console path: SES → Verified identities → Create identity → Domain
# Enter: yourdomain.com
# Add the CNAME/TXT/MX records SES gives you into your DNS (Hostinger)
# Wait for verification status = "Verified" (usually under 1 hour)
```

### 4.2 Exit the SES sandbox 🔴
```
By default SES is in sandbox mode — you can only send to verified addresses.
Request production access:
Console → SES → Account dashboard → Request production access
Fill in: use case, expected volume, bounce/complaint handling policy
Approval usually takes 24 hours.
```

### 4.3 Set up SNS bounce/complaint notifications (🟡)
```bash
# Create SNS topic for bounces
aws sns create-topic --name usam-ses-bounces

# Subscribe your app's webhook endpoint
# POST /api/v1/webhooks/ses-bounce  (implement as needed)
```

---

## 5 · Nginx + SSL

### 5.1 Copy nginx config to server
```bash
scp -i your-key.pem backend/nginx.conf ubuntu@<EC2_IP>:/etc/nginx/sites-available/usam-hub
ssh ubuntu@<EC2_IP>
# Replace all 'yourdomain.com' in the file
sudo sed -i 's/yourdomain.com/actuallyourdomain.com/g' /etc/nginx/sites-available/usam-hub
sudo ln -sf /etc/nginx/sites-available/usam-hub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5.2 Obtain SSL certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Follow prompts — certbot will auto-edit nginx.conf
sudo certbot renew --dry-run   # verify auto-renew works
```

### 5.3 Verify nginx configuration
```bash
curl -I https://yourdomain.com/api/v1/health
# Expected: HTTP/2 200
```

---

## 6 · DNS (Hostinger)

| Record Type | Host | Value | TTL |
|-------------|------|-------|-----|
| A | @ | `<EC2 Elastic IP>` | 300 |
| A | www | `<EC2 Elastic IP>` | 300 |
| A | api | `<EC2 Elastic IP>` | 300 |
| CNAME | mail | SES DKIM value 1 | 300 |
| CNAME | mail2 | SES DKIM value 2 | 300 |
| TXT | @ | SES verification TXT | 300 |
| MX | @ | SES MX record (if receiving email) | 300 |

🔴 **Assign an Elastic IP** to your EC2 instance so the IP never changes on stop/start:
```bash
# Console: EC2 → Elastic IPs → Allocate → Associate to your instance
```

---

## 7 · Environment Variables Reference

Copy this into `/var/www/usam-hub/backend/.env` and fill every value:

```bash
# ── Server ──────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
LOG_LEVEL=info

# ── Database ────────────────────────────────────────────────────
DB_HOST=<your-rds-endpoint>.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=usam_hub
DB_USER=usam_user
DB_PASSWORD=<STRONG_RANDOM_PASSWORD>

# ── JWT (generate with: openssl rand -base64 64) ────────────────
JWT_ACCESS_SECRET=<64+ char random string>
JWT_REFRESH_SECRET=<different 64+ char random string>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
ADMIN_JWT_SECRET=<another 64+ char random string>

# ── OAuth ───────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=<from console.cloud.google.com>
GOOGLE_CLIENT_SECRET=<from console.cloud.google.com>
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/v1/auth/google/callback

GITHUB_CLIENT_ID=<from github.com/settings/developers>
GITHUB_CLIENT_SECRET=<from github.com/settings/developers>
GITHUB_CALLBACK_URL=https://yourdomain.com/api/v1/auth/github/callback

FACEBOOK_APP_ID=<from developers.facebook.com>
FACEBOOK_APP_SECRET=<from developers.facebook.com>
FACEBOOK_CALLBACK_URL=https://yourdomain.com/api/v1/auth/facebook/callback

LINKEDIN_CLIENT_ID=<from linkedin.com/developers>
LINKEDIN_CLIENT_SECRET=<from linkedin.com/developers>
LINKEDIN_CALLBACK_URL=https://yourdomain.com/api/v1/auth/linkedin/callback

# ── AWS ─────────────────────────────────────────────────────────
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<IAM usam-hub-app access key>
AWS_SECRET_ACCESS_KEY=<IAM usam-hub-app secret>
AWS_S3_BUCKET=usam-hub-storage
AWS_S3_BUCKET_PRIVATE=usam-hub-private
AWS_SES_FROM=noreply@yourdomain.com
AWS_SES_REPLY_TO=support@yourdomain.com

# ── Redis ───────────────────────────────────────────────────────
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<STRONG_REDIS_PASSWORD>
REDIS_DB=0

# ── CORS ────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ── Rate Limiting ───────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10

# ── NomadAI ─────────────────────────────────────────────────────
ANTHROPIC_API_KEY=<from console.anthropic.com>
```

---

## 8 · GitHub Repository Secrets

Configure these in **Settings → Secrets and variables → Actions**:

| Secret name | Value |
|-------------|-------|
| `EC2_HOST` | Your EC2 Elastic IP or hostname |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Contents of your `.pem` private key file |
| `VITE_API_URL` | `https://yourdomain.com/api/v1` |
| `VITE_APP_URL` | `https://yourdomain.com` |
| `VITE_WS_URL` | `wss://yourdomain.com` |

---

## 9 · Security Hardening 🔴

```bash
# 1. SSH hardening — disable password auth, change default port (optional)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PermitRootLogin no
sudo systemctl restart ssh

# 2. Redis — set password and bind to localhost only
sudo nano /etc/redis/redis.conf
# requirepass YOUR_STRONG_REDIS_PASSWORD
# bind 127.0.0.1
sudo systemctl restart redis

# 3. UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22    # SSH — restrict to your IP if possible
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# 4. Fail2Ban — block brute-force SSH attempts
sudo apt install fail2ban
sudo systemctl enable fail2ban

# 5. Automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades

# 6. Initial admin: there is NO default admin in production. Provision one
#    explicitly with `npm run provision:admin` (see §1.4). Admin portal:
#    https://yourdomain.com/admin
```

---

## 10 · Monitoring & Alerting (🟡)

### CloudWatch Alarms
```bash
# CPU > 80% for 5 minutes
aws cloudwatch put-metric-alarm \
  --alarm-name "USAM-EC2-HighCPU" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=InstanceId,Value=<your-instance-id> \
  --evaluation-periods 2 \
  --alarm-actions <your-sns-topic-arn>

# RDS connections > 80
aws cloudwatch put-metric-alarm \
  --alarm-name "USAM-RDS-HighConnections" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --period 300 \
  --evaluation-periods 2
```

### PM2 monitoring
```bash
pm2 install pm2-logrotate          # auto-rotate logs
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7

pm2 monit     # live CPU/memory/logs dashboard in terminal
```

---

## 11 · Post-Deploy Verification

Run these checks after every deploy:

```bash
# 1. Health endpoint
curl https://yourdomain.com/api/v1/health
# Expected: {"status":"ok"}

# 2. Auth flow
curl -X POST https://yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","last_name":"User","username":"launchtest","email":"launch@test.com","password":"TestPass123!"}'

# 3. Admin portal login (use the credentials you set via `npm run provision:admin`)
curl -X POST https://yourdomain.com/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<your-provisioned-admin-email>","password":"<your-admin-password>"}'
# → should return access_token

# 4. Swagger docs accessible
curl -I https://yourdomain.com/api/docs
# Expected: HTTP 200

# 5. WebSocket smoke test
# Open browser → Console:
#   const s = io('wss://yourdomain.com/notifications', {auth:{token:'<your_jwt>'}})
#   s.on('connect', () => console.log('WS connected', s.id))

# 6. Email delivery
# Register a new user and verify the welcome email arrives

# 7. File upload
# Log in to the app, edit your profile, upload an avatar
# → verify the image is served from S3

# 8. NomadAI
# Open any community page → click NomadAI chat → send a message
# → verify response arrives (requires ANTHROPIC_API_KEY set)
```

---

## 12 · Rollback Procedure

```bash
# Via PM2 (instant — reverts to last working process state)
# App name is `usam-hub-api` (see deploy/pm2.config.js)
pm2 reload usam-hub-api

# Via Git (revert to previous commit)
ssh ubuntu@<EC2_IP>
cd /var/www/usam-hub
git log --oneline -10        # find last good commit hash
git checkout <commit_hash>
cd backend && npm ci --omit=dev
pm2 reload usam-hub-api

# Database rollback (one migration)
NODE_ENV=production npx sequelize-cli db:migrate:undo

# Or use the pre-built rollback script (prompts for the commit hash)
bash deploy/rollback.sh
```

---

## 13 · Launch Blockers Summary 🔴

Before going live, every one of these must be ✅:

- [ ] Initial super-admin provisioned via `npm run provision:admin` (no seeded default admin exists in prod)
- [ ] `.env` file has real secrets — no placeholder values
- [ ] JWT secrets are 64+ characters, randomly generated
- [ ] Redis is password-protected and bound to localhost
- [ ] UFW firewall enabled, port 3000 not exposed publicly
- [ ] SES sandbox exit request submitted (or approved)
- [ ] SSL certificate installed and auto-renew configured
- [ ] S3 buckets created with correct CORS and bucket policy
- [ ] RDS security group allows only EC2 security group on 3306
- [ ] SSH password auth disabled
- [ ] Elastic IP assigned to EC2
- [ ] DNS records all pointing to Elastic IP
- [ ] `npm audit --audit-level=high` shows no critical vulnerabilities
- [ ] All integration tests pass on CI
- [ ] Health check endpoint responds 200

