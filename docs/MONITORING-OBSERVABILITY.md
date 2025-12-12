# Monitoring & Observability Phase 1

## Components Added
- Prometheus scrape (deployment/prometheus.yml) already present; custom metrics added (backend/app/metrics.py).
- Grafana dashboards provisioned: API Overview, Queue Health.
- Alert rules file (deployment/grafana/alerts/queue-alerts.yaml).
- Structured JSON logging (backend/app/logging_config.py) + request_id middleware.
- Sentry initialization in `backend/app/main.py` (DSN + environment).

## Environment Variables
```
SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.2
FRONTEND_BASE_URL=https://your-frontend
ADMIN_IP_WHITELIST=127.0.0.1,::1
```

## Custom Metrics
| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| app_http_requests_total | Counter | method, path, status | Total HTTP requests processed |
| app_http_request_duration_seconds | Histogram | method, path | Request latency buckets |
| app_queue_jobs_enqueued_total | Counter | queue | Jobs enqueued per queue |
| app_queue_dead_letter_depth | Gauge | queue | Current DLQ depth |
| app_redis_memory_bytes | Gauge | (none) | Redis used memory |

## Dashboards
- API Overview: request rate, p95 latency, error percentage, Redis memory.
- Queue Health: enqueue rate, dead-letter depth.

## Alerts (Examples)
1. HighDeadLetterDepth: sum(app_queue_dead_letter_depth) > 10 for 5m.
2. ErrorRateHigh: error percentage > 5% for 5m.

Configure notification channels in Grafana UI (Slack/email) and attach these alert rules.

## Sentry Integration
Tracing sample rate controlled by `SENTRY_TRACES_SAMPLE_RATE`. Adjust in production after baseline traffic known. PII is not sent (only default breadcrumbs). Add filtering for sensitive data as needed.

## Log Format
Example log line:
```json
{"level":"INFO","message":"Started request","logger":"app","timestamp":1700000000000,"request_id":"b1c2d3"}
```

## Next Steps
1. Add request_id propagation to frontend via X-Request-ID.
2. Integrate Loki / ELK stack for long-term log retention.
3. Expand metrics: business KPIs (orders_created_total, cashback_confirmed_total).
4. Add uptime checks (Blackbox Exporter) and synthetic tests.
5. Build Grafana dashboard for affiliate sync timing & failures.
6. Implement structured error logging with stack traces and correlation id.

## Smoke Test Commands
```bash
# Verify metrics endpoint
curl -s http://localhost:8000/metrics | grep app_http_requests_total | head

# Simulate load (adjust paths)
ab -n 50 -c 5 http://localhost:8000/health

# Check logs
docker compose logs backend | head -n 20
```

## Troubleshooting
| Issue | Action |
|-------|--------|
| Metrics missing | Confirm Instrumentator and custom middleware executed; check /metrics output |
| Dashboards empty | Ensure Prometheus target 'backend:8000' resolves inside Docker network |
| Sentry events absent | Verify SENTRY_DSN set & outbound network allowed |
| Alert not firing | Confirm alert rule file loaded; check Prometheus expression manually |

---
Phase 1 complete. Iterate after baseline traffic & error patterns collected.
