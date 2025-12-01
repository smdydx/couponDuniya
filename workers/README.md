# CouponAli Workers (Bun + Elysia)

High-throughput lightweight workers for outbound communication & async processing.

## Services
- Email Worker (port 4001) – consumes `queue:email`
- SMS Worker (port 4002) – consumes `queue:sms`
- Cashback Worker (port 4003) – consumes `queue:cashback`

## Redis Queue Contract
Jobs are enqueued as JSON strings onto Redis lists. A blocking pop (`BRPOP`) is used.

Example enqueue (email):
```bash
redis-cli LPUSH queue:email '{"to":"user@example.com","template":"welcome","vars":{"name":"User"}}'
```

## Running
Install dependencies then start desired worker(s):
```bash
cd workers
bun install
bun run src/emailWorker.ts
bun run src/smsWorker.ts
bun run src/cashbackWorker.ts
```
Or all at once (background):
```bash
bun run dev:all
```

## Environment Variables
- `REDIS_URL` (default `redis://127.0.0.1:6379`)
- `API_BASE` base URL of FastAPI backend for future callbacks
- `WORKER_TOKEN` auth token (planned secure service-to-service)

## Next Steps
1. Implement real provider integrations (email & SMS)
2. Add retry & DLQ (dead-letter queue) pattern (`queue:email:dlq` etc.)
3. Secure service auth (signed JWT or HMAC header to backend)
4. Batch processing for cashback aggregation
5. Metrics & health endpoints aggregation

## Health Check
Each worker exposes `GET /` returning status JSON.
