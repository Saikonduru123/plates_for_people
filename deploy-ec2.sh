#!/bin/bash

################################################################################
# Plates for People - EC2 Automated Deployment Script
# 
# This script automates the deployment of the Plates for People application
# on a fresh Ubuntu 22.04 EC2 instance.
#
# Usage: 
#   1. SSH into your EC2 instance
#   2. Download this script: wget https://raw.githubusercontent.com/YOUR_REPO/main/deploy-ec2.sh
#   3. Make it executable: chmod +x deploy-ec2.sh
#   4. Run it: ./deploy-ec2.sh
#
################################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
clear
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║        Plates for People - EC2 Deployment Script         ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    log_error "Please do not run this script as root"
    exit 1
fi

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    log_error "This script is designed for Ubuntu 22.04"
    exit 1
fi

log_info "Starting deployment process..."
echo ""

################################################################################
# Step 1: Collect Configuration
################################################################################

log_info "=== Step 1: Configuration Setup ==="
echo ""

# GitHub Repository
read -p "https://github.com/Saikonduru123/plates-for-people.git " GITHUB_REPO
if [ -z "$GITHUB_REPO" ]; then
    log_error "GitHub repository URL is required"
    exit 1
fi

# GitHub Branch
read -p "main " GITHUB_BRANCH
GITHUB_BRANCH=${GITHUB_BRANCH:-main}

# Database Password
while true; do
    read -sp "Enter a secure database password: " DB_PASSWORD
    echo ""
    read -sp "Confirm database password: " DB_PASSWORD_CONFIRM
    echo ""
    if [ "$DB_PASSWORD" = "$DB_PASSWORD_CONFIRM" ]; then
        break
    else
        log_error "Passwords do not match. Please try again."
    fi
done

# Domain Name (optional)
read -p "Enter your domain name (leave blank to skip SSL): " DOMAIN_NAME
if [ -n "$DOMAIN_NAME" ]; then
    read -p "Enter email for SSL certificate: " SSL_EMAIL
fi

log_success "Configuration collected"
echo ""

################################################################################
# Step 2: Update System
################################################################################

log_info "=== Step 2: Updating System Packages ==="
sudo apt update
sudo apt upgrade -y
log_success "System updated"
echo ""

################################################################################
# Step 3: Install Dependencies
################################################################################

log_info "=== Step 3: Installing Dependencies ==="

# Install Python 3.11
log_info "Installing Python 3.11..."
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
alias python3=python3.11

# Install Node.js 20
log_info "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
log_info "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
log_info "Installing Nginx..."
sudo apt install -y nginx

# Install Git and build tools
log_info "Installing Git and build essentials..."
sudo apt install -y git build-essential libssl-dev libffi-dev

# Install Certbot (for SSL)
if [ -n "$DOMAIN_NAME" ]; then
    log_info "Installing Certbot for SSL..."
    sudo apt install -y certbot python3-certbot-nginx
fi

# Install security tools
log_info "Installing security tools..."
sudo apt install -y ufw fail2ban

log_success "All dependencies installed"
echo ""

################################################################################
# Step 4: Configure PostgreSQL
################################################################################

log_info "=== Step 4: Configuring PostgreSQL ==="

sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE plates_for_people;
CREATE USER plates_user WITH PASSWORD '$DB_PASSWORD';
ALTER ROLE plates_user SET client_encoding TO 'utf8';
ALTER ROLE plates_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE plates_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE plates_for_people TO plates_user;
\c plates_for_people
GRANT ALL ON SCHEMA public TO plates_user;
EOF

log_success "PostgreSQL configured"
echo ""

################################################################################
# Step 5: Clone Repository
################################################################################

log_info "=== Step 5: Cloning Repository ==="

sudo mkdir -p /var/www/plates-for-people
sudo chown -R $USER:$USER /var/www/plates-for-people
cd /var/www/plates-for-people

log_info "Cloning from $GITHUB_REPO..."
git clone -b $GITHUB_BRANCH $GITHUB_REPO .

log_success "Repository cloned"
echo ""

################################################################################
# Step 6: Setup Backend
################################################################################

log_info "=== Step 6: Setting Up Backend ==="

cd /var/www/plates-for-people/backend

# Create virtual environment
log_info "Creating Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
log_info "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install uvicorn[standard] gunicorn

# Generate secret key
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# Create .env file
log_info "Creating .env file..."
cat > .env <<EOF
# Database
DATABASE_URL=postgresql+asyncpg://plates_user:$DB_PASSWORD@localhost:5432/plates_for_people

# JWT Settings
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Application
APP_NAME=Plates for People
DEBUG=False
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8000
EOF

if [ -n "$DOMAIN_NAME" ]; then
    echo "ALLOWED_ORIGINS=https://$DOMAIN_NAME,https://www.$DOMAIN_NAME,https://api.$DOMAIN_NAME" >> .env
fi

chmod 600 .env

# Initialize database tables
log_info "Initializing database..."
python3 -c "
import asyncio
from app.database import engine, Base

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('Database tables created')

asyncio.run(init_db())
"

log_success "Backend setup complete"
echo ""

################################################################################
# Step 7: Setup Frontend
################################################################################

log_info "=== Step 7: Setting Up Frontend ==="

cd /var/www/plates-for-people/frontend/plates-for-people

# Install dependencies
log_info "Installing npm dependencies..."
npm ci --production=false

# Create production env file
if [ -n "$DOMAIN_NAME" ]; then
    cat > .env.production <<EOF
VITE_API_URL=https://api.$DOMAIN_NAME
VITE_APP_NAME=Plates for People
EOF
else
    cat > .env.production <<EOF
VITE_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000
VITE_APP_NAME=Plates for People
EOF
fi

log_info "Installing npm dependencies..."
export NODE_OPTIONS="--max-old-space-size=2048"
npm ci --production=false

# Build frontend
log_info "Building frontend..."
npm run build

log_success "Frontend setup complete"
echo ""

################################################################################
# Step 8: Configure systemd Service
################################################################################

log_info "=== Step 8: Configuring Backend Service ==="

# Create log directory
sudo mkdir -p /var/log/plates-backend
sudo chown $USER:$USER /var/log/plates-backend

# Create systemd service
sudo tee /etc/systemd/system/plates-backend.service > /dev/null <<EOF
[Unit]
Description=Plates for People Backend (FastAPI)
After=network.target postgresql.service

[Service]
Type=notify
User=$USER
Group=$USER
WorkingDirectory=/var/www/plates-for-people/backend
Environment="PATH=/var/www/plates-for-people/backend/venv/bin"
ExecStart=/var/www/plates-for-people/backend/venv/bin/gunicorn app.main:app \\
    --workers 4 \\
    --worker-class uvicorn.workers.UvicornWorker \\
    --bind 127.0.0.1:8000 \\
    --access-logfile /var/log/plates-backend/access.log \\
    --error-logfile /var/log/plates-backend/error.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable plates-backend
sudo systemctl start plates-backend

# Check status
if sudo systemctl is-active --quiet plates-backend; then
    log_success "Backend service started successfully"
else
    log_error "Backend service failed to start"
    sudo journalctl -u plates-backend -n 50
    exit 1
fi

echo ""

################################################################################
# Step 9: Configure Nginx
################################################################################

log_info "=== Step 9: Configuring Nginx ==="

if [ -n "$DOMAIN_NAME" ]; then
    # Configuration with domain
    sudo tee /etc/nginx/sites-available/plates-for-people > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME api.$DOMAIN_NAME;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        root /var/www/plates-for-people/frontend/plates-for-people/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name api.$DOMAIN_NAME;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
else
    # Configuration without domain (IP only)
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
    sudo tee /etc/nginx/sites-available/plates-for-people > /dev/null <<EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/plates-for-people/frontend/plates-for-people/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_set_header Host \$host;
    }
}
EOF
fi

# Enable site
sudo ln -sf /etc/nginx/sites-available/plates-for-people /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

log_success "Nginx configured"
echo ""

################################################################################
# Step 10: Configure SSL (if domain provided)
################################################################################

if [ -n "$DOMAIN_NAME" ] && [ -n "$SSL_EMAIL" ]; then
    log_info "=== Step 10: Configuring SSL with Let's Encrypt ==="
    
    log_warning "Make sure your DNS records point to this server before continuing!"
    read -p "Press Enter to continue with SSL setup or Ctrl+C to skip..."
    
    sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME -d api.$DOMAIN_NAME --non-interactive --agree-tos -m $SSL_EMAIL
    
    log_success "SSL configured"
    echo ""
fi

################################################################################
# Step 11: Configure Firewall
################################################################################

log_info "=== Step 11: Configuring Firewall ==="

sudo ufw --force enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

log_success "Firewall configured"
echo ""

################################################################################
# Step 12: Configure Fail2Ban
################################################################################

log_info "=== Step 12: Configuring Fail2Ban ==="

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

log_success "Fail2Ban configured"
echo ""

################################################################################
# Step 13: Create Helper Scripts
################################################################################

log_info "=== Step 13: Creating Helper Scripts ==="

# Create admin user script
cat > /var/www/plates-for-people/backend/create_admin.sh <<'EOF'
#!/bin/bash
cd /var/www/plates-for-people/backend
source venv/bin/activate

read -p "Enter admin email: " ADMIN_EMAIL
read -sp "Enter admin password: " ADMIN_PASSWORD
echo ""

python3 -c "
import asyncio
from passlib.context import CryptContext
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import User

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def create_admin():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == '$ADMIN_EMAIL'))
        existing = result.scalar_one_or_none()
        
        if existing:
            print('Admin user already exists')
        else:
            admin = User(
                email='$ADMIN_EMAIL',
                password_hash=pwd_context.hash('$ADMIN_PASSWORD'),
                role='admin',
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            await db.commit()
            print('✅ Admin user created successfully')

asyncio.run(create_admin())
"
EOF

chmod +x /var/www/plates-for-people/backend/create_admin.sh

# Create deployment script
cat > /var/www/plates-for-people/deploy.sh <<'EOF'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

cd /var/www/plates-for-people
git pull origin main

echo "🐍 Updating backend..."
cd /var/www/plates-for-people/backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
sudo systemctl restart plates-backend

echo "⚛️  Building frontend..."
cd /var/www/plates-for-people/frontend/plates-for-people
npm ci
npm run build

echo "🌐 Reloading Nginx..."
sudo systemctl reload nginx

echo "✨ Deployment complete!"
EOF

chmod +x /var/www/plates-for-people/deploy.sh

# Create backup script
cat > /home/$USER/backup-db.sh <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/$USER/backups"
mkdir -p $BACKUP_DIR

sudo -u postgres pg_dump plates_for_people | gzip > $BACKUP_DIR/plates_db_$DATE.sql.gz

# Keep only last 7 backups
ls -t $BACKUP_DIR/plates_db_*.sql.gz | tail -n +8 | xargs rm -f

echo "Backup completed: plates_db_$DATE.sql.gz"
EOF

chmod +x /home/$USER/backup-db.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$USER/backup-db.sh") | crontab -

log_success "Helper scripts created"
echo ""

################################################################################
# Deployment Complete
################################################################################

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║              🎉 Deployment Successful! 🎉                 ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

log_success "Application deployed successfully!"
echo ""

echo "📋 Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -n "$DOMAIN_NAME" ]; then
    echo "🌐 Frontend URL: https://$DOMAIN_NAME"
    echo "🔌 Backend API: https://api.$DOMAIN_NAME"
    echo "📖 API Docs: https://api.$DOMAIN_NAME/docs"
else
    echo "🌐 Frontend URL: http://$PUBLIC_IP"
    echo "🔌 Backend API: http://$PUBLIC_IP/api"
    echo "📖 API Docs: http://$PUBLIC_IP/docs"
fi
echo "🗄️  Database: PostgreSQL (localhost)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📝 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Create admin user:"
echo "   cd /var/www/plates-for-people/backend"
echo "   ./create_admin.sh"
echo ""
echo "2. Check backend status:"
echo "   sudo systemctl status plates-backend"
echo ""
echo "3. View backend logs:"
echo "   sudo journalctl -u plates-backend -f"
echo ""
echo "4. Deploy updates:"
echo "   /var/www/plates-for-people/deploy.sh"
echo ""
echo "5. Backup database:"
echo "   /home/$USER/backup-db.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log_info "Deployment log saved to: /var/log/plates-deployment.log"
echo ""
