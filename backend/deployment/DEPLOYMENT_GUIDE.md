# Worker Deployment Guide

## Overview
This guide covers deploying CouponAli workers in production using either systemd (VPS) or Docker (containerized).

---

## Option 1: Systemd Deployment (VPS/Bare Metal)

### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Python 3.13+ installed
- Redis and PostgreSQL running
- Application code in `/app/backend`

### Step 1: Install Application
```bash
# Clone repository
cd /app
git clone <repo-url> backend
cd backend

# Install dependencies
python3 -m venv venv
source venv/bin/python
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with production credentials
```

### Step 2: Create Application User
```bash
sudo groupadd -r appuser
sudo useradd -r -g appuser -s /bin/bash appuser
sudo chown -R appuser:appuser /app/backend
```

### Step 3: Install Systemd Services
```bash
# Copy service files
sudo cp deployment/workers.service /etc/systemd/system/
sudo cp deployment/cashback-worker.service /etc/systemd/system/
sudo cp deployment/cron-jobs.service /etc/systemd/system/

# Edit service files to update paths and environment
sudo nano /etc/systemd/system/workers.service
# Update DATABASE_URL, REDIS_URL, and other env vars

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable workers.service
sudo systemctl enable cashback-worker.service
sudo systemctl enable cron-jobs.service

# Start services
sudo systemctl start workers.service
sudo systemctl start cashback-worker.service
sudo systemctl start cron-jobs.service
```

### Step 4: Verify Status
```bash
# Check status
sudo systemctl status workers.service
sudo systemctl status cashback-worker.service
sudo systemctl status cron-jobs.service

# View logs
sudo journalctl -u workers.service -f
sudo journalctl -u cashback-worker.service -f
sudo journalctl -u cron-jobs.service -f
```

### Step 5: Multi-Worker Scaling (Systemd)
To run multiple email/SMS workers:

```bash
# Create template service
sudo cp /etc/systemd/system/workers.service /etc/systemd/system/workers@.service

# Edit workers@.service and add to [Service] section:
# Environment="WORKER_ID=%i"

# Start multiple instances
sudo systemctl start workers@1.service
sudo systemctl start workers@2.service
sudo systemctl start workers@3.service

# Enable on boot
sudo systemctl enable workers@{1..3}.service
```

---

## Option 2: Docker Deployment

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Step 1: Build Worker Image
```bash
cd backend/workers
docker build -t couponali-worker:latest -f Dockerfile ..
```

### Step 2: Update docker-compose.prod.yml
The production compose file already includes worker services with replicas. See `backend/docker-compose.prod.yml`.

### Step 3: Deploy with Docker Compose
```bash
cd backend
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: Scale Workers
```bash
# Scale email/SMS workers to 5 replicas
docker-compose -f docker-compose.prod.yml up -d --scale workers=5

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f workers
docker-compose -f docker-compose.prod.yml logs -f cashback-worker
```

---

## Monitoring & Management

### View Logs
```bash
# Systemd
sudo journalctl -u workers.service --since "1 hour ago"

# Docker
docker logs -f <container-id>
```

### Restart Workers
```bash
# Systemd
sudo systemctl restart workers.service

# Docker
docker-compose -f docker-compose.prod.yml restart workers
```

### Stop Workers
```bash
# Systemd
sudo systemctl stop workers.service

# Docker
docker-compose -f docker-compose.prod.yml stop workers
```

### Update Workers
```bash
# Systemd
cd /app/backend
git pull
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart workers.service
sudo systemctl restart cashback-worker.service

# Docker
cd backend
git pull
docker-compose -f docker-compose.prod.yml build workers
docker-compose -f docker-compose.prod.yml up -d --no-deps workers
```

---

## Health Checks

### Check Worker Health
```bash
# Via API
curl http://localhost:8000/api/v1/health/redis

# Check Redis queue depths
redis-cli LLEN couponali:queue:email
redis-cli LLEN couponali:queue:sms
redis-cli LLEN couponali:queue:email:dlq
```

### Monitor Worker Heartbeats (TODO)
```bash
# Check if workers are processing jobs
redis-cli KEYS "couponali:worker:heartbeat:*"
redis-cli TTL "couponali:worker:heartbeat:worker-1"
```

---

## Troubleshooting

### Worker Not Starting
```bash
# Check logs
sudo journalctl -u workers.service -n 50

# Verify Redis connection
redis-cli ping

# Verify PostgreSQL connection
psql -h localhost -U couponali_user -d couponali -c "SELECT 1"

# Check environment variables
sudo systemctl show workers.service | grep Environment
```

### Jobs Not Processing
```bash
# Check queue depth
redis-cli LLEN couponali:queue:email

# Manually push test job
redis-cli RPUSH couponali:queue:email '{"id":"test","to":"test@example.com","type":"welcome","data":{}}'

# Check worker logs for errors
sudo journalctl -u workers.service -f
```

### High Memory Usage
```bash
# Check memory usage
sudo systemctl status workers.service | grep Memory

# Restart worker
sudo systemctl restart workers.service

# Adjust memory limit in service file if needed
sudo nano /etc/systemd/system/workers.service
# Modify MemoryLimit=512M
```

### DLQ Growing
```bash
# Check DLQ size
redis-cli LLEN couponali:queue:email:dlq

# View DLQ jobs via API
curl http://localhost:8000/api/v1/queue/dead-letter/email

# Retry DLQ jobs via API
curl -X POST http://localhost:8000/api/v1/queue/dead-letter/email/0/retry

# Clear DLQ
curl -X DELETE http://localhost:8000/api/v1/queue/dead-letter/email
```

---

## Performance Tuning

### Recommended Worker Counts
- **Email/SMS Workers**: 2-5 (based on load)
- **Cashback Sync**: 1 (single instance with distributed lock)
- **Cron Jobs**: 1 (single instance)

### BLPOP Timeout
Default is 2 seconds. Adjust in `workers/email_sms_worker.py`:
```python
POLL_TIMEOUT_SECONDS = 5  # Increase for lower CPU usage
```

### Max Attempts
Default is 3 retries. Adjust in `workers/email_sms_worker.py`:
```python
MAX_ATTEMPTS = 5  # Increase for critical jobs
```

---

## Security Considerations

1. **Environment Variables**: Never commit `.env` to git
2. **User Permissions**: Workers run as non-root `appuser`
3. **Network**: Workers should only access Redis/PostgreSQL, not public internet (except API calls)
4. **Secrets**: Use environment variables or secrets manager (e.g., AWS Secrets Manager)

---

## Backup & Recovery

### Backup Configuration
```bash
# Backup systemd service files
sudo cp /etc/systemd/system/workers.service ~/backups/

# Backup environment
cp /app/backend/.env ~/backups/
```

### Recovery
```bash
# Restore service files
sudo cp ~/backups/workers.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart workers.service
```

---

## Auto-Scaling (Advanced)

For Kubernetes or Docker Swarm auto-scaling, see separate guides.

### Horizontal Pod Autoscaler (Kubernetes)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: workers-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: workers
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

**Last Updated**: November 24, 2025  
**Version**: 1.0
