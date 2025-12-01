#!/bin/bash
set -e

echo "🚀 Coupon Commerce Deployment Script"
echo "======================================"

# Configuration
PROJECT_DIR="/var/www/coupon-commerce"
BACKUP_DIR="/var/backups/coupon-commerce"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root or with sudo"
    exit 1
fi

# Create backup
log_info "Creating backup..."
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz -C $PROJECT_DIR .
log_info "Backup created: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

# Pull latest code
log_info "Pulling latest code from repository..."
cd $PROJECT_DIR
git fetch origin
git pull origin main

# Backend deployment
log_info "Deploying backend..."
cd $PROJECT_DIR/backend

# Install Python dependencies
log_info "Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt

# Run database migrations
log_info "Running database migrations..."
alembic upgrade head

# Restart backend service
log_info "Restarting backend service..."
systemctl restart coupon-backend
sleep 3

# Check backend status
if systemctl is-active --quiet coupon-backend; then
    log_info "Backend service is running"
else
    log_error "Backend service failed to start"
    systemctl status coupon-backend
    exit 1
fi

# Frontend deployment
log_info "Deploying frontend..."
cd $PROJECT_DIR/frontend

# Install Node dependencies
log_info "Installing Node dependencies..."
npm ci --production

# Build Next.js app
log_info "Building Next.js application..."
npm run build

# Restart frontend service
log_info "Restarting frontend service..."
systemctl restart coupon-frontend
sleep 3

# Check frontend status
if systemctl is-active --quiet coupon-frontend; then
    log_info "Frontend service is running"
else
    log_error "Frontend service failed to start"
    systemctl status coupon-frontend
    exit 1
fi

# Workers deployment
log_info "Deploying workers..."
cd $PROJECT_DIR/services/workers

# Install Bun dependencies
log_info "Installing Bun dependencies..."
bun install --production

# Restart workers with PM2
log_info "Restarting workers..."
pm2 restart ecosystem.config.js
pm2 save

# Reload Nginx
log_info "Reloading Nginx..."
nginx -t && systemctl reload nginx

# Health checks
log_info "Running health checks..."

# Check backend API
if curl -f http://127.0.0.1:8001/health > /dev/null 2>&1; then
    log_info "✓ Backend API health check passed"
else
    log_warn "✗ Backend API health check failed"
fi

# Check frontend
if curl -f http://127.0.0.1:3000 > /dev/null 2>&1; then
    log_info "✓ Frontend health check passed"
else
    log_warn "✗ Frontend health check failed"
fi

# Check Redis
if redis-cli ping > /dev/null 2>&1; then
    log_info "✓ Redis is running"
else
    log_error "✗ Redis is not running"
fi

# Check PostgreSQL
if pg_isready -h localhost > /dev/null 2>&1; then
    log_info "✓ PostgreSQL is running"
else
    log_error "✗ PostgreSQL is not running"
fi

# Check PM2 workers
log_info "Worker status:"
pm2 list

# Cleanup old backups (keep last 10)
log_info "Cleaning up old backups..."
cd $BACKUP_DIR
ls -t | tail -n +11 | xargs -r rm

log_info "======================================"
log_info "🎉 Deployment completed successfully!"
log_info "======================================"
log_info "Timestamp: $TIMESTAMP"
log_info "Backup: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
echo ""
log_info "Next steps:"
echo "  - Monitor logs: journalctl -u coupon-backend -f"
echo "  - Check PM2: pm2 monit"
echo "  - View Nginx logs: tail -f /var/log/nginx/coupon-*.log"
