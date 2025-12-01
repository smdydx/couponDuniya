# Worker Deployment Guide

## Overview

The Coupon Commerce platform uses Bun-powered TypeScript workers to process email and SMS queues from Redis. This guide covers deployment, configuration, and monitoring.

## Architecture

```
Redis Queue System
├── Email Queue (queue:email:pending)
├── SMS Queue (queue:sms:pending)
├── Processing Sets (queue:email:processing, queue:sms:processing)
└── Dead Letter Queues (queue:email:dead_letter, queue:sms:dead_letter)

Workers (Bun Runtime)
├── email-worker.ts - Processes email queue with retry logic
└── sms-worker.ts - Processes SMS queue with retry logic
```

## Prerequisites

- **Bun Runtime**: v1.0+ (install from https://bun.sh)
- **Redis**: v7+ with persistence enabled
- **Environment Variables**: REDIS_URL, SMTP/SMS credentials

## Installation

### 1. Install Bun

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

### 2. Install Worker Dependencies

```bash
cd workers
bun install
```

### 3. Configure Environment

Create `workers/.env`:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Email Configuration (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@coupons.com

# SMS Configuration (Twilio/SNS)
SMS_PROVIDER=twilio  # or 'aws-sns'
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890

# AWS SNS (if using aws-sns provider)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:sms-topic

# Worker Configuration
MAX_RETRIES=3
RETRY_DELAY_MS=5000
PROCESSING_TIMEOUT_MS=30000
POLL_INTERVAL_MS=1000
```

## Running Workers

### Development Mode

```bash
# Email worker
cd workers
bun run email-worker.ts

# SMS worker
cd workers
bun run sms-worker.ts
```

### Production Mode (PM2)

```bash
# Install PM2
npm install -g pm2

# Start workers with PM2
pm2 start workers/email-worker.ts --interpreter bun --name email-worker
pm2 start workers/sms-worker.ts --interpreter bun --name sms-worker

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Production Mode (systemd)

Create `/etc/systemd/system/coupon-email-worker.service`:

```ini
[Unit]
Description=Coupon Commerce Email Worker
After=network.target redis.target

[Service]
Type=simple
User=coupon
WorkingDirectory=/opt/coupon-commerce/workers
Environment="REDIS_URL=redis://localhost:6379/0"
EnvironmentFile=/opt/coupon-commerce/workers/.env
ExecStart=/usr/local/bin/bun run /opt/coupon-commerce/workers/email-worker.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable coupon-email-worker
sudo systemctl start coupon-email-worker
sudo systemctl status coupon-email-worker
```

## Docker Deployment

### Dockerfile for Workers

```dockerfile
FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy worker source
COPY *.ts ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run healthcheck.ts || exit 1

# Default to email worker (override with docker-compose)
CMD ["bun", "run", "email-worker.ts"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  email-worker:
    build:
      context: ./workers
      dockerfile: Dockerfile
    environment:
      - REDIS_URL=redis://redis:6379/0
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - SMTP_FROM=${SMTP_FROM}
    depends_on:
      - redis
    restart: unless-stopped
    command: ["bun", "run", "email-worker.ts"]

  sms-worker:
    build:
      context: ./workers
      dockerfile: Dockerfile
    environment:
      - REDIS_URL=redis://redis:6379/0
      - SMS_PROVIDER=${SMS_PROVIDER}
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - TWILIO_FROM_NUMBER=${TWILIO_FROM_NUMBER}
    depends_on:
      - redis
    restart: unless-stopped
    command: ["bun", "run", "sms-worker.ts"]

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

## Monitoring & Health Checks

### Queue Statistics

Access queue stats via API:

```bash
curl http://localhost:8000/api/v1/health/redis
```

Response:

```json
{
  "status": "healthy",
  "redis": "connected",
  "queues": {
    "email": {
      "pending": 15,
      "processing": 2,
      "dead_letter": 0
    },
    "sms": {
      "pending": 8,
      "processing": 1,
      "dead_letter": 0
    }
  },
  "total": {
    "pending": 23,
    "processing": 3,
    "dead_letter": 0
  }
}
```

### Worker Logs

```bash
# PM2 logs
pm2 logs email-worker
pm2 logs sms-worker

# Systemd logs
sudo journalctl -u coupon-email-worker -f

# Docker logs
docker-compose logs -f email-worker
docker-compose logs -f sms-worker
```

### Metrics to Monitor

1. **Queue Depth**: `pending` count (alert if > 1000)
2. **Processing Count**: `processing` count (should be low)
3. **Dead Letter Queue**: `dead_letter` count (investigate if > 0)
4. **Worker Uptime**: Process restarts (alert on frequent restarts)
5. **Message Processing Time**: Average duration per message

### Alerting (Example with Prometheus)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'coupon-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/api/v1/health/redis'
```

## Retry Logic

### How Retries Work

1. Worker pops message from `queue:email:pending`
2. Adds to `queue:email:processing` with timestamp
3. Attempts to send email
4. **On Success**: Removes from processing set
5. **On Failure**: 
   - Increments retry count
   - Re-queues with `retries` field incremented
   - If `retries >= MAX_RETRIES`: Moves to `queue:email:dead_letter`

### Retry Configuration

```typescript
// email-worker.ts configuration
const config = {
  maxRetries: 3,           // Max retry attempts
  retryDelayMs: 5000,      // Wait 5s between retries
  processingTimeoutMs: 30000  // Timeout stale jobs after 30s
};
```

### Manual Retry from DLQ

```bash
# Inspect dead letter queue
redis-cli lrange queue:email:dead_letter 0 -1

# Re-queue failed message
redis-cli lpush queue:email:pending '{"to":"user@example.com","subject":"Test","body":"..."}'
```

## Troubleshooting

### Workers Not Processing

1. **Check Redis Connection**:
   ```bash
   redis-cli -u $REDIS_URL ping
   ```

2. **Verify Queue Contents**:
   ```bash
   redis-cli llen queue:email:pending
   redis-cli lrange queue:email:pending 0 5
   ```

3. **Check Worker Process**:
   ```bash
   pm2 status
   pm2 monit
   ```

### High Dead Letter Queue Count

1. **Inspect Failed Messages**:
   ```bash
   redis-cli lrange queue:email:dead_letter 0 10
   ```

2. **Common Causes**:
   - Invalid SMTP credentials
   - Malformed email addresses
   - Network timeouts
   - Rate limiting from email provider

3. **Fix and Re-queue**:
   ```bash
   # Move all DLQ messages back to pending
   redis-cli rpoplpush queue:email:dead_letter queue:email:pending
   ```

### Performance Optimization

1. **Scale Workers Horizontally**: Run multiple worker instances
   ```bash
   pm2 start email-worker.ts -i 4  # 4 instances
   ```

2. **Tune Poll Interval**: Lower `POLL_INTERVAL_MS` for lower latency (increases CPU)

3. **Batch Processing**: Modify workers to process multiple messages per cycle

4. **Redis Persistence**: Use AOF for durability vs RDB for performance

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Redis Authentication**: Use `requirepass` in production
3. **TLS for Redis**: Use `rediss://` protocol with SSL
4. **SMTP Credentials**: Store in secrets manager (AWS Secrets, Vault)
5. **Network Isolation**: Workers should only access Redis and SMTP/SMS endpoints

## Backup & Recovery

### Redis Backup

```bash
# Manual backup
redis-cli --rdb /backup/dump.rdb

# Automated backup (cron)
0 */6 * * * redis-cli --rdb /backup/dump-$(date +\%Y\%m\%d-\%H\%M).rdb
```

### Queue Recovery

```bash
# Export queue to file
redis-cli lrange queue:email:pending 0 -1 > email-backup.json

# Restore queue from file
cat email-backup.json | while read msg; do redis-cli lpush queue:email:pending "$msg"; done
```

## Additional Resources

- [Bun Documentation](https://bun.sh/docs)
- [Redis Queue Patterns](https://redis.io/topics/data-types-intro#lists)
- [SMTP Relay Best Practices](https://www.cloudflare.com/learning/email-security/what-is-smtp/)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
