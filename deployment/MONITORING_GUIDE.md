# Monitoring & Realtime Guide

## Overview
This guide covers the new Phase 2 pending items now implemented:

1. Redis Pub/Sub real-time event streaming (`/api/v1/realtime/ws`)
2. Feature flag system (Redis hash `feature:flags`)
3. Nginx load balancing backend upstream (`backend:8000` service name)
4. Prometheus metrics endpoint (`/metrics`) + Grafana dashboards

---
## 1. Redis Pub/Sub + WebSocket
### Channels
- `events:orders` – order status / fulfillment changes
- `events:cashback` – cashback event lifecycle updates

### Client Example (JavaScript)
```js
const ws = new WebSocket('wss://api.yourdomain.com/api/v1/realtime/ws');
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data); // { channel, data }
  if (msg.channel === 'events:orders') {
    // update UI
  }
};
```

### Publishing
Use helpers in `app/events.py` or direct `publish(channel, payload)`.

---
## 2. Feature Flags
Stored in Redis hash `feature:flags` with `1` = enabled, `0` = disabled.

### API Endpoints
- `GET /api/v1/flags/` – list all flags
- `GET /api/v1/flags/{name}` – flag state
- `PUT /api/v1/flags/{name}?enabled=true` – set state (admin)

### Usage
```python
from app.feature_flags import is_enabled
if is_enabled('new_checkout'): ...
```

Recommended to namespace flags: `checkout.new_flow`, `cashback.auto_approve`.

---
## 3. Nginx Load Balancing
`deployment/nginx.conf` updated to reference upstream `backend_api` pointing to Docker service `backend:8000`.
When scaling replicas (Docker Swarm/Kubernetes), DNS-based round robin is automatic.

Enable multiple replicas:
```bash
docker service update --replicas=3 coupon_backend
```

For classic VM scaling list additional servers in `upstream backend_api { ... }`.

---
## 4. Prometheus & Grafana
### Stack Components
- Prometheus: scrapes `/metrics` from backend
- Grafana: visualizes metrics (default credentials admin/admin)

### Compose Services
Added to `backend/docker-compose.prod.yml`:
- `prometheus` on `9090`
- `grafana` on `3001`

### Prometheus Config
`deployment/prometheus.yml` targets `backend:8000` with `scrape_interval: 15s`.

### Metrics Endpoint
Instrumentation via `prometheus-fastapi-instrumentator` exposed at `/metrics`.

### Dashboard Creation
1. Open Grafana: `http://localhost:3001`
2. Import dashboard: Use FastAPI/Python template or create new panel.
3. Key metrics:
   - `http_requests_total`
   - `http_request_duration_seconds_bucket`
   - `process_cpu_seconds_total`
   - `process_resident_memory_bytes`

### Alerting (Next Steps)
Integrate Alertmanager for threshold-based alerts on error rate & latency.

---
## Security & Hardening Next Steps
- Protect `/metrics` behind auth or private network.
- Add role-based access for flag mutation.
- Add rate limiting on WebSocket connections.
- Dashboard provisioning with versioned JSON.

---
## Quick Run (Local)
```bash
cd backend
docker compose -f docker-compose.prod.yml up -d --build
open http://localhost:3001  # Grafana
curl http://localhost:9090/targets  # Prometheus targets
```

---
## Verification Checklist
| Item | Command | Expectation |
|------|---------|-------------|
| Metrics | `curl :8000/metrics | head` | Prometheus-formatted output |
| Flags API | `curl :8000/api/v1/flags/` | JSON flags dict |
| WebSocket | Connect client | Receive events on order status change |
| Prometheus | `curl :9090/-/healthy` | `Prometheus Server is Healthy.` |
| Grafana | Browser login | Prometheus datasource present |

---
## Next Extensions
1. Add custom business metrics (cashback confirmations, order throughput).
2. Add dashboard JSON to version control under `deployment/grafana/provisioning/dashboards/`.
3. Implement feature flag caching layer for high‑volume checks.
4. Add SSE fallback endpoint for environments where WebSockets are restricted.

---
## Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty `/metrics` | Instrumentator import failed | Reinstall deps, check requirements.txt |
| WebSocket disconnects | Idle timeout or network proxy | Enable ping/pong or SSE fallback |
| Prometheus target down | Container name mismatch | Verify `backend:8000` reachable from Prometheus container |
| Grafana no datasource | Provisioning volume path wrong | Check compose volume mapping |

---
## License & Notes
Internal operational guide. Do not expose publicly without review.
