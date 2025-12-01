# Service Mesh & Internal Communication Patterns

This project does not yet run a full mesh (Istio/Linkerd), but we enforce clear boundaries between public-facing APIs, admin APIs, and internal service-to-service calls.

## Public vs. Internal
- **Public APIs**: Under `/api/v1` and protected by JWT (where required). Rate limits applied per-endpoint via Redis.
- **Internal APIs**: Endpoints that should only be called by trusted services must send `X-Internal-Key` that matches `INTERNAL_API_KEY` in the backend config. Example: `offer_views` telemetry is internal-only.
- **Admin APIs**: JWT + RBAC; not meant for public clients.

## Traffic Control
- **Rate limiting**: Redis-based per-endpoint limits using `rate_limit_dependency(scope, limit, window_seconds)`. Apply to public endpoints to protect from abuse.
- **Pub/Sub**: Use Redis `publish` for fan-out to workers (e.g., cache invalidation, checkout/payment events, cashback events). Consumers subscribe via workers or sidecars.
- **Queues**: Use Redis lists for async jobs (email, SMS, clicks, cashback) to decouple services.

## Mesh Readiness
- If a mesh is introduced later, expose services over mTLS and route traffic by path:
  - Gateway → Backend `/api/v1/*`
  - Gateway → Webhooks `/payments/*`
  - Internal traffic: workers/redirector → Backend using `X-Internal-Key`
- Add service discovery labels and health endpoints (`/health`) for readiness probes.

## Next Steps
- Enforce `X-Internal-Key` on any new internal-only routes.
- Subscribe workers to `events:*` Redis channels for real-time processing.
- Add per-endpoint rate-limit values into config to tune per surface (auth vs. browse vs. admin).
