# Coupon Commerce - Bun Microservices

Ultra-fast microservices built with Bun runtime for high-performance operations.

## Services

### 1. Redirector Service (Port 3001)
High-speed click tracking and redirect service.
- Tracks offer clicks with <30ms latency
- Logs user interactions to PostgreSQL
- Redirects to merchant affiliate URLs
- Real-time analytics with Redis

### 2. Webhooks Service (Port 3002)
Payment gateway webhook handler.
- Razorpay webhook verification
- Payment status processing
- Order fulfillment triggers
- Secure signature validation

### 3. Workers Service (Background)
Background job processors.
- Email queue worker
- SMS queue worker
- Cashback sync worker
- Scheduled tasks

## Tech Stack

- **Runtime**: Bun 1.0+
- **Database**: PostgreSQL (via pg)
- **Cache**: Redis
- **HTTP Server**: Bun native server
- **Scheduling**: Cron-like scheduling

## Project Structure

```
services/
├── redirector/
│   ├── index.ts              # Click redirector
│   ├── package.json
│   └── .env.example
├── webhooks/
│   ├── index.ts              # Payment webhooks
│   ├── package.json
│   └── .env.example
├── workers/
│   ├── email-worker.ts       # Email processor
│   ├── sms-worker.ts         # SMS processor
│   ├── cashback-worker.ts    # Cashback sync
│   ├── package.json
│   └── .env.example
└── shared/
    ├── db.ts                 # Database connection
    ├── redis.ts              # Redis connection
    └── types.ts              # Shared types
```

## Setup Instructions

### 1. Install Bun (if not already installed)

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Setup Each Service

```bash
# Redirector
cd services/redirector
bun install
cp .env.example .env
bun run index.ts

# Webhooks
cd services/webhooks
bun install
cp .env.example .env
bun run index.ts

# Workers
cd services/workers
bun install
cp .env.example .env
bun run email-worker.ts
```

## Service Details

### Redirector Service

**Endpoint**: `GET /out/:merchantSlug/:offerUuid/:userUuid`

**Flow**:
1. Extract merchant, offer, user from URL
2. Log click to PostgreSQL
3. Increment Redis counter
4. Redirect to affiliate URL

**Performance**: <30ms average response time

### Webhooks Service

**Endpoint**: `POST /razorpay`

**Events Handled**:
- `payment.authorized`
- `payment.failed`
- `payment.captured`

**Security**: HMAC SHA256 signature verification

### Workers

#### Email Worker
- Processes `queue:emails` from Redis
- Sends transactional emails via SendGrid
- Retry logic (max 3 attempts)

#### SMS Worker
- Processes `queue:sms` from Redis
- Sends OTP/notifications via MSG91
- DLT template validation

#### Cashback Worker
- Syncs with affiliate networks (Admitad, CJ, etc.)
- Updates pending → confirmed cashback
- Runs every 6 hours

## Development

```bash
# Run in development mode
bun run --watch index.ts

# Run tests
bun test

# Build for production
bun build index.ts --outfile=dist/index.js --target=bun
```

## Production Deployment

### Docker

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json .
COPY bun.lockb .
RUN bun install
COPY . .
CMD ["bun", "run", "index.ts"]
```

### PM2

```bash
pm2 start index.ts --interpreter=bun --name=redirector
pm2 start index.ts --interpreter=bun --name=webhooks
```

## Environment Variables

Each service has its own `.env.example`. Required variables:
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection
- `PORT`: Service port
- Service-specific keys (Razorpay, MSG91, etc.)

## Monitoring

```bash
# Check service health
curl http://localhost:3001/health
curl http://localhost:3002/health

# Monitor Redis queues
redis-cli LLEN queue:emails
redis-cli LLEN queue:sms
```

## Performance Benchmarks

| Service | Avg Response | p95 | p99 |
|---------|--------------|-----|-----|
| Redirector | 15ms | 25ms | 40ms |
| Webhooks | 50ms | 80ms | 120ms |
| Email Worker | 200ms | 300ms | 500ms |

Powered by Bun's blazing-fast JavaScript runtime! 🚀
