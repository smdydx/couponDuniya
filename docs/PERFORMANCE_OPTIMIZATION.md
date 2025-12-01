# Performance Optimization Checklist

- **Load Testing**
  - Use Locust/k6 (see docs/LOAD_TEST_PLAN.md) on checkout, redirects, listings, wallet.
  - Targets: p95 < 800ms, error rate < 1%.

- **Query Audit**
  - Inspect slow queries via Postgres `pg_stat_statements`.
  - Ensure indexes on: offers(merchant_id, is_active), offer_clicks(created_at, offer_id), order_items(order_id, created_at), wallet_transactions(user_id, created_at), cashback_events(user_id, status), products(merchant_id, is_active).
  - Avoid N+1 in list/detail endpoints (prefetch relationships where needed).

- **Redis Cache Expansion**
  - Categories cached (600s).
  - Trending offers cached (3600s).
  - Consider caching homepage sections, landing pages, and config/rules (cashback rules) with explicit invalidation on admin edits.

- **CDN (Cloudflare)**
  - Front static assets cached at edge; bypass for `/api/*` and `/go/*`.
  - Security headers + HSTS in Nginx; see docs/CLOUDFLARE-CDN.md.

- **Frontend Bundle**
  - Next config: console stripping in prod, static cache headers for `_next/static`, image device sizes tuned.
  - Use dynamic imports for heavy admin-only graphs/components.
  - Keep `optimizePackageImports` (lucide-react) to reduce bundle size.

- **Server Tuning**
  - Gunicorn/Uvicorn workers sized to CPU; enable keepalive in Nginx upstreams.
  - Redis memory policy: allkeys-lru, set `maxmemory` in `/etc/redis/redis.conf`.
  - Postgres: tune `work_mem`, `shared_buffers`, `effective_cache_size` based on instance size.

- **Monitoring**
  - Track p95 latency, error rate, cache hit rate, DB connections, Redis hits/misses.
  - Use Prometheus/Grafana dashboards (deployment/monitoring).
