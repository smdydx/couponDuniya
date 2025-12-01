# Security Audit & OWASP Checklist

This document serves as a baseline for internal security review and external penetration testing preparation.

## 1. Authentication & Session
- [x] Password hashing (bcrypt/pbkdf2 via Passlib)
- [x] JWT with exp & jti
- [x] Logout blacklists token jti
- [ ] Refresh token rotation & revocation list
- [ ] Enforce password complexity (length, charset, reuse prevention)
- [ ] Two-Factor Authentication (TOTP / WebAuthn)
- [ ] Device/session management UI

## 2. Authorization
- [x] RBAC for admin endpoints
- [x] Admin IP whitelist (optional env var)
- [ ] Fine-grained permissions audit
- [ ] Role change logging review

## 3. Input Validation & Encoding
- [x] Pydantic schema validation on all public POST endpoints
- [x] SQLAlchemy ORM prevents raw SQL injection vectors
- [ ] Add global payload size limits
- [ ] Sanitize rich-text / HTML inputs (blog, CMS) before launch

## 4. Cryptography
- [x] Unique SECRET_KEY (ensure rotation plan for prod)
- [ ] At-rest encryption for sensitive PII (phone, address)
- [ ] Key management policy (vault/KMS) documented

## 5. Rate Limiting & Abuse Prevention
- [x] Global IP rate limit middleware
- [x] OTP request throttling
- [ ] Per-route granular limits (auth/login stricter)
- [ ] Dynamic ban list (too many 401/429 events)

## 6. Password Reset Flow
- [x] Stateless token stored in Redis (TTL 30m)
- [x] Single-use invalidation
- [ ] Token derivation hardened (consider HMAC wrapping)
- [ ] Password history / reuse prevention

## 7. Logging & Monitoring
- [x] Basic console logging
- [ ] Structured JSON logs (include request id)
- [ ] Central aggregation (Loki/ELK) planned
- [ ] Sentry error tracking integration
- [ ] Suspicious pattern alerts (multiple failed logins)

## 8. Security Headers
- [x] X-Content-Type-Options: nosniff
- [x] X-Frame-Options: DENY
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Basic Content-Security-Policy
- [ ] Strict-Transport-Security (enable in TLS termination layer)
- [ ] Permissions-Policy (camera; geolocation; etc.)

## 9. OWASP Top 10 Mapping
| Risk | Status | Notes |
|------|--------|-------|
| A01 Broken Access Control | Partial | RBAC present; needs audit & tests |
| A02 Cryptographic Failures | Partial | Password hashing ok; key rotation pending |
| A03 Injection | Good | ORM + parameterization; need lint for raw SQL |
| A04 Insecure Design | Partial | Threat model doc pending |
| A05 Security Misconfiguration | Partial | Need hardened prod configs, headers complete |
| A06 Vulnerable Components | Pending | SBOM & dependency scanner not integrated |
| A07 Auth & Identification Failures | Partial | Reset flow done; MFA pending |
| A08 Software/Data Integrity | Pending | Signed deploy artifacts not implemented |
| A09 Security Logging & Monitoring | Partial | Baseline; needs centralization & alerts |
| A10 SSRF | Good | No server-side fetch from user-supplied URLs |

## 10. Penetration Test Preparation
- [ ] Freeze commit for test window
- [ ] Enable verbose structured logs
- [ ] Provide tester with non-privileged and admin credentials
- [ ] Load sample data (merchants/offers/orders)
- [ ] Activate all feature flags required for coverage

## 11. Redis Security
- [x] Namespaced keys (rk helper)
- [ ] AUTH & TLS for production Redis
- [ ] Key usage dashboard (monitor growth & anomalies)

## 12. Incident Response
- [ ] Runbook for credential leak
- [ ] Runbook for data corruption
- [ ] Contact escalation tree

## 13. Deployment Hardening
- [x] Multi-stage Docker images (non-root user)
- [ ] Image vulnerability scan (Trivy/Grype) in CI
- [ ] Minimal OS packages (slim images verified)
- [ ] Secrets injected at runtime (avoid bake-in)

## 14. Checklist Before Launch
- [ ] Sentry active & alert rules configured
- [ ] Prometheus dashboards & alert thresholds
- [ ] Password complexity enforcement live
- [ ] Per-endpoint rate limits tuned
- [ ] Dependency vulnerability scan passing
- [ ] Penetration test report reviewed & remediated

## 15. Next Steps
1. Implement per-endpoint rate limit decorator
2. Add structured logging + request id middleware
3. Integrate Sentry SDK and tag user/session
4. Enforce password complexity + history
5. MFA feature (TOTP + recovery codes)
6. Add HSTS header once TLS termination deployed
7. Automate nightly dependency scans
8. Draft formal threat model (architecture review)

---
Generated as part of Security Hardening Phase 1.
