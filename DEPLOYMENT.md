# 🚀 Deployment Plan - Plates for People on AWS EC2

## 📋 Overview

This guide covers deploying the Plates for People application to an AWS EC2 instance without Docker:

- **Backend**: FastAPI (Python) with PostgreSQL
- **Frontend**: Ionic React (Static build served via Nginx)
- **Web Server**: Nginx as reverse proxy
- **Process Manager**: systemd for backend, static files for frontend
- **Database**: PostgreSQL
- **SSL**: Let's Encrypt (Certbot)

---

## 🖥️ EC2 Instance Setup

### 1. Launch EC2 Instance

**Recommended Specifications:**

- **Instance Type**: `t3.medium` (2 vCPU, 4 GB RAM) or `t3.small` for testing
- **AMI**: Ubuntu 22.04 LTS (64-bit x86)
- **Storage**: 20-30 GB SSD
- **Security Group Rules**:
  ```
  SSH (22)       - Your IP
  HTTP (80)      - 0.0.0.0/0
  HTTPS (443)    - 0.0.0.0/0
  PostgreSQL (5432) - Only if external access needed
  ```

### 2. Connect to Instance

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip

# Update system packages
sudo apt update && sudo apt upgrade -y
```

---

## 📦 Install Required Software

### 1. Install Python 3.11+

```bash
# Add deadsnakes PPA for latest Python
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install python3.11 python3.11-venv python3.11-dev python3-pip -y

# Set Python 3.11 as default
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
```

### 2. Install Node.js & npm

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x
npm --version
```

### 3. Install PostgreSQL

```bash
# Install PostgreSQL 15
sudo apt install postgresql postgresql-contrib -y

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql --version
```

### 4. Install Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

### 5. Install Additional Tools

```bash
# Install Git
sudo apt install git -y

# Install build essentials (for Python packages)
sudo apt install build-essential libssl-dev libffi-dev -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

---

## 🗄️ Database Setup

### 1. Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE plates_for_people;
CREATE USER plates_user WITH PASSWORD 'your_secure_password_here';
ALTER ROLE plates_user SET client_encoding TO 'utf8';
ALTER ROLE plates_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE plates_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE plates_for_people TO plates_user;

# Grant schema permissions
\c plates_for_people
GRANT ALL ON SCHEMA public TO plates_user;

# Exit PostgreSQL
\q
```

### 2. Allow Password Authentication (if needed)

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Change this line:
# local   all             all                                     peer
# To:
# local   all             all                                     md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## 📥 Clone Repository from GitHub

### 1. Set Up Deployment Directory

```bash
# Create application directory
sudo mkdir -p /var/www/plates-for-people
sudo chown -R ubuntu:ubuntu /var/www/plates-for-people
cd /var/www/plates-for-people
```

### 2. Clone Repository

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/plates-for-people.git .

# Or if using SSH
git clone git@github.com:YOUR_USERNAME/plates-for-people.git .
```

---

## 🐍 Backend Setup

### 1. Create Python Virtual Environment

```bash
cd /var/www/plates-for-people/backend

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### 2. Install Python Dependencies

```bash
# Install requirements
pip install -r requirements.txt

# Install production server (if not in requirements.txt)
pip install uvicorn[standard] gunicorn
```

### 3. Configure Environment Variables

```bash
# Create .env file
nano /var/www/plates-for-people/backend/.env
```

**Add the following:**

```env
# Database
DATABASE_URL=postgresql+asyncpg://plates_user:your_secure_password_here@localhost:5432/plates_for_people

# JWT Settings
SECRET_KEY=your_super_secret_jwt_key_min_32_chars_random_string_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Application
APP_NAME=Plates for People
DEBUG=False
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (if configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

**Generate Secret Key:**

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4. Initialize Database

```bash
# Activate virtual environment if not already active
source /var/www/plates-for-people/backend/venv/bin/activate

# Run database initialization script
cd /var/www/plates-for-people/backend
python3 scripts/init_db.py  # If you have one

# Or run migrations/table creation
# alembic upgrade head  # If using Alembic
```

### 5. Test Backend

```bash
# Test run the backend
cd /var/www/plates-for-people/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Test in another terminal
curl http://localhost:8000/docs
# Press Ctrl+C to stop
```

---

## ⚛️ Frontend Setup

### 1. Install Frontend Dependencies

```bash
cd /var/www/plates-for-people/frontend/plates-for-people

# Install npm packages
npm ci --production=false
```

### 2. Configure Frontend Environment

```bash
# Create or update environment file
nano /var/www/plates-for-people/frontend/plates-for-people/.env.production
```

**Add:**

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Plates for People
```

### 3. Update API Base URL

Edit `frontend/plates-for-people/src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.yourdomain.com';
```

### 4. Build Frontend

```bash
cd /var/www/plates-for-people/frontend/plates-for-people

# Build for production
npm run build

# Build output will be in 'dist' folder
ls -la dist/
```

---

## 🔧 Configure systemd for Backend

### 1. Create systemd Service File

```bash
sudo nano /etc/systemd/system/plates-backend.service
```

**Add the following:**

```ini
[Unit]
Description=Plates for People Backend (FastAPI)
After=network.target postgresql.service

[Service]
Type=notify
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/plates-for-people/backend
Environment="PATH=/var/www/plates-for-people/backend/venv/bin"
ExecStart=/var/www/plates-for-people/backend/venv/bin/gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --access-logfile /var/log/plates-backend/access.log \
    --error-logfile /var/log/plates-backend/error.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Create Log Directory

```bash
sudo mkdir -p /var/log/plates-backend
sudo chown ubuntu:ubuntu /var/log/plates-backend
```

### 3. Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable plates-backend

# Start the service
sudo systemctl start plates-backend

# Check status
sudo systemctl status plates-backend

# View logs
sudo journalctl -u plates-backend -f
```

---

## 🌐 Configure Nginx

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/plates-for-people
```

**Add the following:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main Frontend Server (HTTPS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend files
    root /var/www/plates-for-people/frontend/plates-for-people/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API Backend Server (HTTPS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to FastAPI backend
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase body size for file uploads
    client_max_body_size 10M;
}
```

### 2. Enable Site Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/plates-for-people /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL Certificate Setup (Let's Encrypt)

### 1. Update DNS Records

Before running Certbot, ensure your domain DNS points to your EC2 instance:

```
A Record: yourdomain.com → EC2_PUBLIC_IP
A Record: www.yourdomain.com → EC2_PUBLIC_IP
A Record: api.yourdomain.com → EC2_PUBLIC_IP
```

### 2. Obtain SSL Certificates

```bash
# Obtain certificates for all domains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (Yes recommended)
```

### 3. Auto-renewal Setup

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job, verify:
sudo systemctl list-timers | grep certbot
```

---

## 🚀 Deployment Scripts

### 1. Create Deployment Script

```bash
nano /var/www/plates-for-people/deploy.sh
```

**Add:**

```bash
#!/bin/bash

set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
cd /var/www/plates-for-people
git pull origin main

# Backend deployment
echo "🐍 Deploying backend..."
cd /var/www/plates-for-people/backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
sudo systemctl restart plates-backend
echo "✅ Backend deployed and restarted"

# Frontend deployment
echo "⚛️  Building frontend..."
cd /var/www/plates-for-people/frontend/plates-for-people
npm ci
npm run build
echo "✅ Frontend built successfully"

# Reload Nginx
echo "🌐 Reloading Nginx..."
sudo systemctl reload nginx

echo "✨ Deployment complete!"
echo "🔍 Check backend status: sudo systemctl status plates-backend"
echo "🔍 Check backend logs: sudo journalctl -u plates-backend -f"
```

**Make executable:**

```bash
chmod +x /var/www/plates-for-people/deploy.sh
```

### 2. Create Admin User Setup Script

```bash
nano /var/www/plates-for-people/backend/create_admin.sh
```

```bash
#!/bin/bash

cd /var/www/plates-for-people/backend
source venv/bin/activate

python3 -c "
import asyncio
from passlib.context import CryptContext
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def create_admin():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == 'admin@example.com'))
        existing = result.scalar_one_or_none()

        if existing:
            print('Admin already exists')
        else:
            admin = User(
                email='admin@example.com',
                password_hash=pwd_context.hash('CHANGE_THIS_PASSWORD'),
                role='admin',
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            await db.commit()
            print('✅ Admin user created')

asyncio.run(create_admin())
"
```

```bash
chmod +x /var/www/plates-for-people/backend/create_admin.sh
```

---

## 🔍 Monitoring & Logs

### Backend Logs

```bash
# Real-time logs
sudo journalctl -u plates-backend -f

# Last 100 lines
sudo journalctl -u plates-backend -n 100

# Application logs
tail -f /var/log/plates-backend/access.log
tail -f /var/log/plates-backend/error.log
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Logs

```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

---

## 🔐 Security Hardening

### 1. Firewall Setup (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status verbose
```

### 2. Fail2Ban (Prevent Brute Force)

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Enable SSH jail and restart
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Secure PostgreSQL

```bash
# Restrict PostgreSQL to localhost only
sudo nano /etc/postgresql/15/main/postgresql.conf

# Set:
# listen_addresses = 'localhost'

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 4. Environment Variables Security

```bash
# Protect .env file
chmod 600 /var/www/plates-for-people/backend/.env
```

---

## 📊 Performance Optimization

### 1. PostgreSQL Tuning

```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
```

**Recommended settings for t3.medium (4GB RAM):**

```conf
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10485kB
min_wal_size = 1GB
max_wal_size = 4GB
```

```bash
sudo systemctl restart postgresql
```

### 2. Nginx Caching (Optional)

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside `http` block:

```nginx
# Cache configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m use_temp_path=off;
```

---

## 🔄 Maintenance Tasks

### Backup Database

```bash
# Create backup script
nano /home/ubuntu/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

sudo -u postgres pg_dump plates_for_people | gzip > $BACKUP_DIR/plates_db_$DATE.sql.gz

# Keep only last 7 backups
ls -t $BACKUP_DIR/plates_db_*.sql.gz | tail -n +8 | xargs rm -f

echo "Backup completed: plates_db_$DATE.sql.gz"
```

```bash
chmod +x /home/ubuntu/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh
```

### Update Application

```bash
# Run deployment script
/var/www/plates-for-people/deploy.sh
```

---

## ✅ Final Checklist

- [ ] EC2 instance running and accessible
- [ ] All software installed (Python, Node.js, PostgreSQL, Nginx)
- [ ] Database created and configured
- [ ] Repository cloned from GitHub
- [ ] Backend virtual environment set up
- [ ] Backend .env configured with correct values
- [ ] Backend service running (`sudo systemctl status plates-backend`)
- [ ] Frontend built successfully
- [ ] Nginx configured and running
- [ ] DNS records pointing to EC2 IP
- [ ] SSL certificates obtained and configured
- [ ] Firewall rules configured
- [ ] Admin user created
- [ ] Backup script set up
- [ ] Application accessible at https://yourdomain.com
- [ ] API accessible at https://api.yourdomain.com

---

## 🆘 Troubleshooting

### Backend not starting

```bash
# Check service status
sudo systemctl status plates-backend

# Check logs
sudo journalctl -u plates-backend -n 50

# Test manually
cd /var/www/plates-for-people/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend showing blank page

```bash
# Check if build was successful
ls -la /var/www/plates-for-people/frontend/plates-for-people/dist

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Rebuild frontend
cd /var/www/plates-for-people/frontend/plates-for-people
npm run build
```

### Database connection errors

```bash
# Test PostgreSQL connection
sudo -u postgres psql -d plates_for_people

# Check if service is running
sudo systemctl status postgresql

# Check connection string in .env file
cat /var/www/plates-for-people/backend/.env | grep DATABASE_URL
```

### SSL certificate issues

```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## 📞 Support

For issues or questions:

1. Check application logs
2. Review Nginx error logs
3. Verify all services are running
4. Ensure DNS is properly configured
5. Check security group rules in AWS

---

**🎉 Your application is now deployed and running in production!**

Access your application at: `https://yourdomain.com`
