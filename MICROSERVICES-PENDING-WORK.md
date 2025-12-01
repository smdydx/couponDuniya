# 🔧 MICROSERVICES PENDING WORK LIST
## Current Status: 68% Complete

**Framework**: FastAPI (Backend) + Bun (Microservices)  
**Current Completion**: Worker prototype done, production integration pending  
**Target**: 95%+ production-ready microservices

---

## 📋 WHAT EXISTS (COMPLETED)

### ✅ Backend Workers (Python)
- `backend/workers/email_sms_worker.py` - Redis queue consumer
  - BLPOP-based polling (2-second timeout)
  - Processing set tracking
  - Dead Letter Queue (DLQ) handling
  - MAX_ATTEMPTS=3 retry logic
  - Stub handlers for email/SMS

### ✅ Bun Workers (TypeScript)
- `services/workers/src/email-worker.ts` - SendGrid integration (partial)
- `services/workers/src/sms-worker.ts` - MSG91 integration (partial)
- Both have DLQ, retry logic, and template stubs

### ✅ Bun Microservices
- `services/redirector/` - Fast outbound redirect service
- `services/webhooks/` - Webhook handler service
- Both Dockerized and ready for deployment

### ✅ Infrastructure
- Docker Compose configuration
- Queue API endpoints (`/api/v1/queue/*`)
- Queue management functions in `backend/app/queue.py`
- Health check endpoints with Redis stats

---

## ❌ CRITICAL MISSING WORK (Production Blockers)

### 1. **Email Provider Integration** ⏱️ 1 day
**Current State**: Stub handlers in Python worker, partial SendGrid in Bun  
**Needed**:
- [ ] Choose primary worker: Python OR Bun (recommend: keep Python for consistency)
- [ ] Integrate real SendGrid API in Python worker:
  ```python
  from sendgrid import SendGridAPIClient
  from sendgrid.helpers.mail import Mail
  ```
- [ ] Create production email templates:
  - [ ] Welcome email (with verification link)
  - [ ] OTP email
  - [ ] Order confirmation (with voucher codes)
  - [ ] Cashback credited notification
  - [ ] Withdrawal processed confirmation
  - [ ] Password reset email
- [ ] Add environment variables:
  - [ ] `SENDGRID_API_KEY`
  - [ ] `FROM_EMAIL`
  - [ ] `FROM_NAME`
- [ ] Test end-to-end email delivery
- [ ] Handle SendGrid errors & rate limits
- [ ] Add email delivery tracking/logging

**Files to Modify**:
- `backend/workers/email_sms_worker.py` → Replace `_process_email()` stub
- `backend/.env.example` → Add SendGrid config
- Create `backend/workers/email_templates.py` → Template functions

---

### 2. **SMS Provider Integration** ⏱️ 1 day
**Current State**: Stub handler in Python worker, partial MSG91 in Bun  
**Needed**:
- [ ] Integrate MSG91 API in Python worker:
  ```python
  import requests
  def send_sms(mobile: str, template_id: str, vars: dict):
      # MSG91 API call
  ```
- [ ] Create SMS templates:
  - [ ] OTP SMS
  - [ ] Order confirmation SMS
  - [ ] Cashback credited SMS
  - [ ] Withdrawal processed SMS
- [ ] Add environment variables:
  - [ ] `MSG91_AUTH_KEY`
  - [ ] `MSG91_SENDER_ID`
  - [ ] `MSG91_TEMPLATE_ID` (or multiple template IDs)
- [ ] Implement DLT template compliance (India regulations)
- [ ] Test SMS delivery
- [ ] Handle MSG91 errors & rate limits

**Files to Modify**:
- `backend/workers/email_sms_worker.py` → Replace `_process_sms()` stub
- Create `backend/workers/sms_templates.py` → Template mapping

---

### 3. **Worker Deployment & Orchestration** ⏱️ 2 days
**Current State**: Python worker exists, no production deployment  
**Needed**:
- [ ] **Systemd Service** for Python worker:
  ```ini
  [Unit]
  Description=Email/SMS Worker
  After=network.target redis.service postgresql.service
  
  [Service]
  Type=simple
  User=appuser
  WorkingDirectory=/app/backend
  ExecStart=/usr/bin/python -m workers.email_sms_worker
  Restart=always
  RestartSec=10
  
  [Install]
  WantedBy=multi-user.target
  ```
- [ ] **Docker Container** for workers (separate from backend):
  ```dockerfile
  FROM python:3.13-slim
  COPY backend/workers /app/workers
  COPY backend/app /app/app
  CMD ["python", "-m", "workers.email_sms_worker"]
  ```
- [ ] **Multi-worker Scaling**:
  - [ ] Run 2-3 worker processes concurrently (no conflicts since BLPOP is atomic)
  - [ ] Add `docker-compose.prod.yml` workers service with `replicas: 3`
- [ ] **Graceful Shutdown**:
  - [ ] Handle SIGTERM/SIGINT properly
  - [ ] Finish processing current job before exit
  - [ ] Re-queue incomplete jobs from processing set
- [ ] **Health Checks**:
  - [ ] Worker heartbeat to Redis (`worker:heartbeat:{worker_id}` with TTL)
  - [ ] Monitor via `/api/v1/health/workers` endpoint
- [ ] **Monitoring & Alerting**:
  - [ ] Log worker start/stop events
  - [ ] Alert if worker down for >5 minutes
  - [ ] Track processing rate (jobs/minute)

**Files to Create**:
- `backend/deployment/workers.service` → Systemd config
- `backend/workers/Dockerfile` → Worker container
- Update `docker-compose.prod.yml` → Add workers service

---

### 4. **Cashback Sync Worker** ⏱️ 2-3 days
**Current State**: Stub file exists (`services/workers/src/cashback-sync.ts`)  
**Needed**:
- [ ] **Affiliate API Integration** (see separate section below)
- [ ] **Python Cashback Sync Worker**:
  - [ ] Create `backend/workers/cashback_sync_worker.py`
  - [ ] Fetch affiliate transactions daily (cron-based)
  - [ ] Match transactions to users via click tracking
  - [ ] Create `cashback_events` with status=pending
  - [ ] Update status to confirmed after validation
  - [ ] Add cashback to wallet
- [ ] **Scheduling**:
  - [ ] Use `schedule` library or cron job
  - [ ] Run daily at 2 AM (low traffic time)
  - [ ] Handle pagination for large transaction sets
- [ ] **Error Handling**:
  - [ ] Log unmatched transactions to DLQ
  - [ ] Retry failed API calls (exponential backoff)
  - [ ] Send admin alerts for sync failures

**Files to Create**:
- `backend/workers/cashback_sync_worker.py`
- `backend/workers/affiliate_api_client.py` (API wrappers)

---

### 5. **Affiliate API Integration** ⏱️ 3-4 days (CRITICAL)
**Current State**: Stub clients in `backend/app/services/affiliate_clients.py`  
**Needed**:
- [ ] **Admitad Integration**:
  - [ ] Obtain API credentials (Client ID, Secret)
  - [ ] Implement OAuth2 token refresh
  - [ ] Fetch transactions endpoint: `GET /statistics/actions/`
  - [ ] Parse JSON response → map to `affiliate_transactions` table
- [ ] **VCommission Integration**:
  - [ ] Obtain API key
  - [ ] Fetch transactions: `GET /api/transactions`
  - [ ] Handle CSV/XML format (if applicable)
- [ ] **CueLinks Integration**:
  - [ ] Obtain API credentials
  - [ ] Fetch transactions with date range
  - [ ] Parse response & insert to DB
- [ ] **Transaction Mapping**:
  - [ ] Match `external_transaction_id` → our `affiliate_clicks.external_click_id`
  - [ ] Join with `users` to find `user_id`
  - [ ] Calculate cashback amount (commission × percentage)
  - [ ] Insert to `cashback_events`
- [ ] **Error Handling**:
  - [ ] Handle rate limits (429 responses)
  - [ ] Retry failed requests (3 attempts)
  - [ ] Log API errors to `audit_logs`

**Files to Modify**:
- `backend/app/services/affiliate_clients.py` → Replace stubs with real API calls
- `backend/app/services/affiliate_sync.py` → Use real clients

**Environment Variables Needed**:
```env
# Admitad
ADMITAD_CLIENT_ID=xxx
ADMITAD_CLIENT_SECRET=xxx
ADMITAD_REFRESH_TOKEN=xxx

# VCommission
VCOMMISSION_API_KEY=xxx

# CueLinks
CUELINKS_API_KEY=xxx
CUELINKS_PUBLISHER_ID=xxx
```

---

### 6. **Bun Redirector Service Enhancement** ⏱️ 1 day
**Current State**: Basic redirect implemented, needs optimization  
**Needed**:
- [ ] **Redis Caching**:
  - [ ] Cache offer URLs for 5 minutes: `redirect:url:{offer_id}`
  - [ ] Cache merchant tracking templates: `redirect:merchant:{merchant_id}`
- [ ] **Rate Limiting**:
  - [ ] Limit redirects per IP: 100/minute
  - [ ] Use Redis INCR: `ratelimit:redirect:{ip}`
- [ ] **Click Queue Optimization**:
  - [ ] Batch click logs to Redis first: `RPUSH queue:clicks`
  - [ ] Worker flushes to PostgreSQL every 10 seconds (reduce DB load)
- [ ] **Analytics Endpoint**:
  - [ ] `GET /stats` → Return click counts, top offers, etc.
- [ ] **Deployment**:
  - [ ] Deploy to production (separate container)
  - [ ] Nginx reverse proxy: `/out/*` → redirector service

**Files to Modify**:
- `services/redirector/src/index.ts`
- Update `docker-compose.prod.yml` → Add redirector service

---

### 7. **Webhook Service Enhancement** ⏱️ 1 day
**Current State**: Basic scaffold exists  
**Needed**:
- [ ] **Razorpay Webhook Handling**:
  - [ ] Currently in FastAPI backend, move to Bun service for performance
  - [ ] Signature verification
  - [ ] Idempotency via Redis lock
- [ ] **Affiliate Webhooks**:
  - [ ] Admitad webhook receiver (transaction confirmed)
  - [ ] VCommission webhook receiver
  - [ ] Validate signatures
  - [ ] Push to Redis queue: `queue:cashback`
- [ ] **Webhook Logging**:
  - [ ] Log all webhook requests (timestamp, source, payload hash)
  - [ ] Store in `webhook_logs` table
- [ ] **Retry Mechanism**:
  - [ ] If processing fails, push to DLQ
  - [ ] Admin UI to replay failed webhooks

**Files to Modify**:
- `services/webhooks/src/index.ts`
- Create `services/webhooks/src/razorpay.ts`
- Create `services/webhooks/src/affiliate.ts`

---

### 8. **Cron Jobs Service** ⏱️ 1 day
**Current State**: Not implemented  
**Needed**:
- [ ] **Create Cron Service** (`services/cron/` or in workers):
  ```python
  # backend/workers/cron_jobs.py
  import schedule
  import time
  
  def expire_old_offers():
      # Mark expired offers
      pass
  
  def recalc_wallet_balances():
      # Verify wallet integrity
      pass
  
  schedule.every().day.at("02:00").do(expire_old_offers)
  schedule.every().day.at("03:00").do(recalc_wallet_balances)
  
  while True:
      schedule.run_pending()
      time.sleep(60)
  ```
- [ ] **Jobs to Implement**:
  - [ ] **Expire Old Offers** (daily 2 AM):
    - Mark offers with `expires_at < NOW()` as inactive
  - [ ] **Recalculate Wallet Balances** (daily 3 AM):
    - Sum `wallet_transactions` and verify against `wallet_balances.balance`
  - [ ] **Sync Inventory** (hourly):
    - Update stock counts from external sources (if any)
  - [ ] **Generate Sitemap** (daily 4 AM):
    - Create XML sitemap for SEO
    - Upload to `/public/sitemap.xml`
  - [ ] **Clean Old Logs** (weekly):
    - Delete `audit_logs` older than 90 days
    - Archive `webhook_logs` older than 30 days
  - [ ] **Send Pending Cashback Reminders** (weekly):
    - Email users with pending cashback >30 days
- [ ] **Deployment**:
  - [ ] Systemd service or separate Docker container
  - [ ] Ensure only one instance runs (distributed lock)

**Files to Create**:
- `backend/workers/cron_jobs.py`
- `backend/deployment/cron.service` (Systemd)

---

## ⚠️ IMPORTANT ENHANCEMENTS (Post-Launch)

### 9. **Worker Monitoring Dashboard** ⏱️ 1 day
**Needed**:
- [ ] Admin UI: `/admin/workers`
- [ ] Show worker status (active/inactive)
- [ ] Show queue depths (email, SMS, clicks, cashback)
- [ ] Show processing rate (jobs/min)
- [ ] Show DLQ counts with retry actions
- [ ] Real-time updates via polling/WebSocket

**Already Exists**: Backend API at `/api/v1/queue/*`

---

### 10. **Structured Logging** ⏱️ 1 day
**Current State**: Console logs only  
**Needed**:
- [ ] JSON-formatted logs:
  ```python
  import logging
  import json
  
  logging.basicConfig(
      format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
      level=logging.INFO
  )
  ```
- [ ] Log aggregation (push to Loki/ELK)
- [ ] Correlation IDs for request tracking

---

### 11. **Worker Auto-Scaling** ⏱️ 2 days
**Needed**:
- [ ] Monitor queue depth via `/api/v1/queue/stats`
- [ ] If `pending > 1000`, scale workers to 5 replicas
- [ ] If `pending < 100`, scale down to 2 replicas
- [ ] Implement in Docker Swarm or Kubernetes

---

### 12. **Worker Performance Testing** ⏱️ 1 day
**Needed**:
- [ ] Load test: Push 10,000 jobs to queue
- [ ] Measure throughput (jobs/second)
- [ ] Measure latency (enqueue → completion)
- [ ] Identify bottlenecks (Redis, DB, API calls)
- [ ] Target: >100 jobs/second per worker

---

## 🟢 OPTIONAL ENHANCEMENTS (Future)

### 13. **WebSocket Real-Time Updates** ⏱️ 2 days
- [ ] Push order updates to frontend via WebSocket
- [ ] Push cashback notifications in real-time
- [ ] Use Redis Pub/Sub for message distribution

### 14. **GraphQL API** ⏱️ 1 week
- [ ] Add GraphQL endpoint for flexible queries
- [ ] Replace some REST endpoints

### 15. **Microservice Decomposition** ⏱️ 3-4 weeks
- [ ] Split monolith into:
  - Orders Service
  - Wallet Service
  - Cashback Service
  - Product Service
  - User Service
- [ ] Use message queue (Kafka/RabbitMQ) for inter-service communication

---

## 📊 COMPLETION CHECKLIST

### Critical (Must Have - Week 1-2)
- [ ] Email provider integration (SendGrid)
- [ ] SMS provider integration (MSG91)
- [ ] Worker deployment (systemd/Docker)
- [ ] Affiliate API integration (Admitad/VCommission/CueLinks)
- [ ] Cashback sync worker

### Important (Should Have - Week 3)
- [ ] Redirector optimization (caching, rate limiting)
- [ ] Webhook service enhancement
- [ ] Cron jobs service
- [ ] Worker monitoring dashboard

### Optional (Nice to Have - Post-Launch)
- [ ] Structured logging
- [ ] Auto-scaling
- [ ] Performance testing
- [ ] WebSocket real-time updates

---

## 🎯 REVISED MICROSERVICES COMPLETION ESTIMATE

| Component | Current | Target | Time Needed |
|-----------|---------|--------|-------------|
| Email Worker | 30% (stub) | 95% | 1 day |
| SMS Worker | 30% (stub) | 95% | 1 day |
| Cashback Sync | 10% (stub) | 95% | 2-3 days |
| Affiliate APIs | 5% (stubs) | 95% | 3-4 days |
| Redirector | 60% | 90% | 1 day |
| Webhooks | 40% | 90% | 1 day |
| Cron Jobs | 0% | 90% | 1 day |
| Monitoring | 0% | 80% | 1 day |

**Total Time to 95% Completion**: ~10-12 days (2 weeks)  
**Current Overall**: 68% → **Target**: 95%

---

## 🚀 RECOMMENDED EXECUTION ORDER

### Week 1 (Critical Path)
1. **Day 1-2**: Affiliate API Integration (Admitad, VCommission, CueLinks)
2. **Day 3**: Email Provider Integration (SendGrid)
3. **Day 4**: SMS Provider Integration (MSG91)
4. **Day 5**: Cashback Sync Worker

### Week 2 (Production Readiness)
1. **Day 6-7**: Worker Deployment & Orchestration (systemd, Docker, scaling)
2. **Day 8**: Redirector & Webhook Optimization
3. **Day 9**: Cron Jobs Service
4. **Day 10**: Worker Monitoring Dashboard

### Week 3 (Polish)
1. Performance testing
2. Structured logging
3. Documentation
4. Stress testing

---

## 📝 NEXT STEPS

**Decision Point**: Choose your priority track:

**Option A (Revenue-First)**: 
Start with Affiliate API Integration → unlock cashback revenue immediately

**Option B (Infrastructure-First)**:
Start with Email/SMS integration → enable user communication, then affiliate

**Recommended**: **Option A** (Affiliate APIs first) - this is the revenue engine

---

**Last Updated**: November 24, 2025  
**Maintainer**: Development Team  
**Review Frequency**: After each milestone completion
