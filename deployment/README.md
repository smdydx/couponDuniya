# Deployment Guide

## Prerequisites

### System Requirements
- Ubuntu 20.04+ or Debian 11+
- 4GB RAM minimum (8GB recommended)
- 50GB disk space
- Root or sudo access

### Software Requirements
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install Python 3.11+
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install PostgreSQL 15+
sudo apt install -y postgresql postgresql-contrib

# Install Redis 8.x
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

## Initial Setup

### 1. Create Application User
```bash
sudo useradd -m -s /bin/bash coupon
sudo usermod -aG www-data coupon
```

### 2. Clone Repository
```bash
sudo mkdir -p /var/www/coupon-commerce
sudo chown coupon:www-data /var/www/coupon-commerce
cd /var/www/coupon-commerce
git clone https://github.com/yourusername/coupon-commerce.git .
```

### 3. Database Setup
```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE coupon_commerce;
CREATE USER coupon_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE coupon_commerce TO coupon_user;
\q
EOF

# Run migrations
cd /var/www/coupon-commerce/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
```

### 4. Redis Configuration
```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Set:
maxmemory 512mb
maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis
```

### 5. Environment Variables

**Backend** (`/var/www/coupon-commerce/backend/.env`):
```env
DATABASE_URL=postgresql://coupon_user:your_password@localhost:5432/coupon_commerce
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-min-32-chars
SENDGRID_API_KEY=SG.xxx
EMAIL_ENABLED=true
SMS_ENABLED=true
```

**Frontend** (`/var/www/coupon-commerce/frontend/.env.production`):
```env
NEXT_PUBLIC_API_URL=https://api.couponcommerce.com
NEXT_PUBLIC_SITE_URL=https://couponcommerce.com
```

**Workers** (`/var/www/coupon-commerce/services/workers/.env`):
```env
DATABASE_URL=postgresql://coupon_user:your_password@localhost:5432/coupon_commerce
REDIS_URL=redis://localhost:6379
SENDGRID_API_KEY=SG.xxx
MSG91_AUTH_KEY=xxx
ADMITAD_ACCESS_TOKEN=xxx
VCOMMISSION_TOKEN=xxx
CUELINKS_API_KEY=xxx
```

### 6. SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d couponcommerce.com -d www.couponcommerce.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### 7. Install Systemd Services
```bash
# Copy service files
sudo cp deployment/systemd/*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable coupon-backend
sudo systemctl enable coupon-frontend
sudo systemctl enable coupon-workers

# Start services
sudo systemctl start coupon-backend
sudo systemctl start coupon-frontend
sudo systemctl start coupon-workers
```

### 8. Setup Nginx
```bash
# Copy Nginx config
sudo cp deployment/nginx.conf /etc/nginx/sites-available/coupon-commerce

# Create symlink
sudo ln -s /etc/nginx/sites-available/coupon-commerce /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 9. Log Rotation
```bash
sudo cp deployment/logrotate.conf /etc/logrotate.d/coupon-commerce
sudo logrotate -f /etc/logrotate.conf
```

### 10. Database Backups (cron)
```bash
# One-off backup
sudo POSTGRES_USER=coupon_user POSTGRES_DB=coupon_commerce ./deployment/backup.sh

# Cron daily at 2am (edit with crontab -e)
0 2 * * * POSTGRES_USER=coupon_user POSTGRES_DB=coupon_commerce /var/www/coupon-commerce/deployment/backup.sh
```

## Deployment

### Using Deployment Script
```bash
cd /var/www/coupon-commerce
sudo ./deployment/deploy.sh
```

### Manual Deployment

**Backend:**
```bash
cd /var/www/coupon-commerce/backend
source venv/bin/activate
git pull origin main
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart coupon-backend
```

**Frontend:**
```bash
cd /var/www/coupon-commerce/frontend
git pull origin main
npm ci --production
npm run build
sudo systemctl restart coupon-frontend
```

**Workers:**
```bash
cd /var/www/coupon-commerce/services/workers
git pull origin main
bun install --production
pm2 restart all
```

## Monitoring

### Service Status
```bash
# Check all services
sudo systemctl status coupon-backend
sudo systemctl status coupon-frontend
pm2 status

# Check logs
journalctl -u coupon-backend -f
journalctl -u coupon-frontend -f
pm2 logs
```

### Health Checks
```bash
# Backend API
curl http://127.0.0.1:8001/health

# Frontend
curl http://127.0.0.1:3000

# Redis
redis-cli ping

# PostgreSQL
pg_isready
```

### PM2 Monitoring
```bash
pm2 monit           # Real-time monitoring
pm2 logs            # View logs
pm2 restart all     # Restart all workers
pm2 reload all      # Zero-downtime reload
```

## Backup & Restore

### Database Backup
```bash
# Create backup
pg_dump -U coupon_user coupon_commerce > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U coupon_user coupon_commerce < backup_20250124.sql
```

### Automated Backups
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * pg_dump -U coupon_user coupon_commerce | gzip > /var/backups/coupon-db-$(date +\%Y\%m\%d).sql.gz

# Clean old backups (keep 30 days)
0 3 * * * find /var/backups -name "coupon-db-*.sql.gz" -mtime +30 -delete
```

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
journalctl -u coupon-backend -n 100

# Check Python environment
cd /var/www/coupon-commerce/backend
source venv/bin/activate
python -c "import app.main"

# Check database connection
psql -U coupon_user -h localhost coupon_commerce
```

### Workers Not Processing Jobs
```bash
# Check PM2 status
pm2 status
pm2 logs email-worker

# Check Redis
redis-cli
> LLEN queue:email
> SMEMBERS queue:email:processing
> LRANGE queue:email:dlq 0 -1

# Restart workers
pm2 restart all
```

### High Memory Usage
```bash
# Check processes
pm2 monit
htop

# Adjust PM2 max memory restart
pm2 delete all
pm2 start ecosystem.config.js
```

### Slow API Response
```bash
# Check database
psql -U coupon_user coupon_commerce
> SELECT * FROM pg_stat_activity;

# Check Redis
redis-cli --stat
redis-cli INFO memory

# Check Nginx access logs
tail -f /var/log/nginx/coupon-access.log
```

## Security Checklist

- [ ] SSL certificate installed and auto-renewal enabled
- [ ] Firewall configured (UFW)
- [ ] Database password is strong and unique
- [ ] SECRET_KEY is random and secure (min 32 chars)
- [ ] API rate limiting configured in Nginx
- [ ] Admin routes restricted by IP (optional)
- [ ] Environment files have proper permissions (600)
- [ ] PostgreSQL only accepts local connections
- [ ] Redis protected mode enabled
- [ ] Regular security updates scheduled

## Performance Optimization

### PostgreSQL
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_offers_merchant ON offers(merchant_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);

-- Analyze tables
ANALYZE offers;
ANALYZE orders;
```

### Redis
```bash
# Increase max connections if needed
redis-cli CONFIG SET maxclients 10000
```

### Nginx
```nginx
# Enable gzip compression (already in config)
gzip on;
gzip_types text/plain text/css application/json;

# Enable caching (already in config)
proxy_cache_path /var/cache/nginx...
```

## Scaling

### Horizontal Scaling (Multiple Servers)

1. **Database:** Use PostgreSQL replication
2. **Redis:** Use Redis Cluster or Sentinel
3. **Load Balancer:** Add multiple backend/frontend servers
4. **Workers:** Can run on separate servers

### Vertical Scaling

1. Increase worker instances in PM2
2. Add more Uvicorn workers for backend
3. Increase PostgreSQL connections
4. Add more Redis memory

## Maintenance

### Regular Tasks
- Weekly: Review error logs
- Weekly: Check disk space
- Monthly: Update dependencies
- Monthly: Review and optimize database
- Quarterly: Review and update SSL certificates
- Quarterly: Security audit

### Update Dependencies
```bash
# Backend
cd backend
source venv/bin/activate
pip list --outdated
pip install -U package_name

# Frontend
cd frontend
npm outdated
npm update

# Workers
cd services/workers
bun update
```
