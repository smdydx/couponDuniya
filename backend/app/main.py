from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .api.v1 import (
    users,
    merchants,
    offers,
    products,
    orders,
    wallet,
    auth,
    admin,
    access,
    gift_cards,
    referrals,
    cashback,
    withdrawals,
    payouts,
    support_tickets,
    notifications,
    audit_logs,
    payments,
    cms_pages,
    sessions,
    kyc,
    inventory,
    commissions,
    redirects,
    offer_views,
    categories,
    search,
    cms,
    checkout,
    cart,
    health,
    affiliate,
    queue,
    flags,
    realtime,
    blog,
    blog_uploads,
    homepage,
)
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.openapi.docs import get_swagger_ui_html
from .database import Base, engine

settings = get_settings()

app = FastAPI(title=settings.APP_NAME)
# Ensure tables exist in development (no-op if already migrated)
try:
    @app.on_event("startup")
    async def ensure_database_schema():
        Base.metadata.create_all(bind=engine)
except Exception:
    pass

# CORS configuration to allow frontend on port 3000
origins = [o.strip() for o in (settings.CORS_ORIGINS or "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware using Redis
from .redis_client import rate_limit, redis_client
from fastapi import Request, HTTPException
import time, uuid, logging, os
from .logging_config import log, with_request_id
from .metrics import observe_request, set_redis_memory, set_dead_letter
from .config import get_settings
settings = get_settings()

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path == "/health" or request.url.path.startswith("/docs"):
        return await call_next(request)
    client_ip = request.client.host or "unknown"
    start = time.time()
    allowed, remaining, ttl = rate_limit(client_ip, limit=100, window_seconds=60)
    if not allowed:
        raise HTTPException(status_code=429, detail="Too many requests. Slow down.")
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    logger = with_request_id(log, request_id)
    response = await call_next(request)
    duration = time.time() - start
    try:
        observe_request(request.method, request.url.path, response.status_code, duration)
    except Exception:
        pass
    response.headers["X-Request-ID"] = request_id
    response.headers["X-RateLimit-Limit"] = "100"
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(ttl)
    return response

# Security headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("X-XSS-Protection", "0")  # Modern browsers ignore; CSP recommended
    # Minimal CSP (adjust as needed)
    response.headers.setdefault("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'")
    return response

# Periodic metrics update task (Redis stats, DLQ depth)
try:
    import asyncio
    async def metrics_refresher():
        while True:
            try:
                info = redis_client.info()
                used = info.get("used_memory", 0)
                set_redis_memory(int(used))
                # Dead letter queues
                for q in ["email", "sms", "cashback"]:
                    dlq_key = f"queue:{q}:dlq"
                    depth = redis_client.llen(dlq_key)
                    set_dead_letter(q, depth)
            except Exception:
                pass
            await asyncio.sleep(15)
    @app.on_event("startup")
    async def start_metrics_refresher():
        asyncio.create_task(metrics_refresher())
except Exception:
    pass

# Periodic affiliate sync scheduler (simple loop). Interval configurable via AFFILIATE_SYNC_INTERVAL_MINUTES.
try:
    from .tasks.affiliate_sync import sync_affiliate_transactions
    from .database import SessionLocal
    AFFILIATE_INTERVAL_MINUTES = float(os.getenv("AFFILIATE_SYNC_INTERVAL_MINUTES", "1440"))  # default daily

    async def affiliate_sync_scheduler():
        while True:
            start_ts = time.time()
            session = SessionLocal()
            try:
                result = sync_affiliate_transactions(session)
                log.info(f"Affiliate periodic sync imported={result['imported']} updated={result['updated']} total={result['total']}")
            except Exception as e:
                log.error(f"Affiliate periodic sync failed: {e}")
            finally:
                session.close()
            # Sleep remaining interval (convert minutes to seconds)
            elapsed = time.time() - start_ts
            sleep_for = max(5.0, AFFILIATE_INTERVAL_MINUTES * 60 - elapsed)
            await asyncio.sleep(sleep_for)

    @app.on_event("startup")
    async def start_affiliate_scheduler():
        # Skip if interval set to 0 or negative
        if AFFILIATE_INTERVAL_MINUTES > 0:
            asyncio.create_task(affiliate_sync_scheduler())
except Exception:
    pass

# Sentry integration
try:
    if settings.SENTRY_DSN:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.SENTRY_ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            integrations=[FastApiIntegration()],
        )
except Exception:
    pass

# Include all routers with /api/v1 prefix
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(merchants.router, prefix="/api/v1")
app.include_router(offers.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(wallet.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(access.router, prefix="/api/v1")
app.include_router(gift_cards.router, prefix="/api/v1")
app.include_router(referrals.router, prefix="/api/v1")
app.include_router(cashback.router, prefix="/api/v1")
app.include_router(withdrawals.router, prefix="/api/v1")
app.include_router(payouts.router, prefix="/api/v1")
app.include_router(support_tickets.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(audit_logs.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(cms_pages.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(kyc.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(commissions.router, prefix="/api/v1")
app.include_router(redirects.router, prefix="/api/v1")
app.include_router(offer_views.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(cms.router, prefix="/api/v1")
app.include_router(checkout.router, prefix="/api/v1")
app.include_router(cart.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(affiliate.router, prefix="/api/v1")
app.include_router(queue.router, prefix="/api/v1")
app.include_router(flags.router, prefix="/api/v1")
app.include_router(realtime.router, prefix="/api/v1")
app.include_router(blog.router, prefix="/api/v1")
app.include_router(blog_uploads.router, prefix="/api/v1")
app.include_router(homepage.router, prefix="/api/v1")


GROUP_ORDER = [
    ("Auth", ["Auth"]),
    ("Users", ["Users"]),
    ("Merchants", ["Merchants"]),
    ("Offers", ["Offers"]),
    ("Offers", ["Categories"]),
    ("Products", ["Products"]),
    ("Orders", ["Checkout"]),
    ("Orders", ["Orders"]),
    ("Wallet", ["Wallet"]),
    ("Gifts", ["Gifts"]),
    ("Engagement", ["Engagement"]),
    ("Cashback", ["Cashback"]),
    ("Affiliate", ["Affiliate"]),
    ("Finance", ["Finance"]),
    ("Engagement", ["Search"]),
    ("CMS", ["CMS"]),
    ("Support", ["Support"]),
    ("Admin", ["Admin"]),
    ("Access", ["Access Control"]),
    ("System", ["System"]),
    ("KYC", ["KYC"]),
    ("Sessions", ["Sessions"]),
    ("Inventory", ["Inventory"]),
    ("Commissions", ["Commissions"]),
    ("Redirects", ["Redirects"]),
    ("Offer Views", ["OfferViews"]),
    ("CMS", ["CMS"]),
]

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version="0.1.0",
        description="Hybrid coupon + commerce API",
        routes=app.routes,
    )
    grouped_tags = []
    for group_name, tag_list in GROUP_ORDER:
        for tag in tag_list:
            grouped_tags.append({"name": tag, "x-group": group_name})
    openapi_schema["tags"] = grouped_tags
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

app.mount("/static", StaticFiles(directory="app/static"), name="static")
# Serve images directory for merchant logos, offer images, etc.
app.mount("/images", StaticFiles(directory="app/images"), name="images")
# Serve uploads directory for blog images
from pathlib import Path
Path("uploads/blog").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/docs", include_in_schema=False)
def custom_docs():
    html = get_swagger_ui_html(openapi_url=app.openapi_url, title=f"{settings.APP_NAME} Docs", swagger_css_url="/static/swagger.css")
    # Inject dark mode toggle
    injected = html.body.decode().replace("</body>", "<button class='dark-mode-toggle' onclick=\"document.documentElement.classList.toggle('dark');\">Toggle Dark</button></body>")
    return HTMLResponse(injected)

@app.get("/health", tags=["System"])
def health():
    return {"status": "ok"}

# Prometheus instrumentation
try:
    from prometheus_fastapi_instrumentator import Instrumentator
    Instrumentator().instrument(app).expose(app, include_in_schema=False)
except Exception:
    pass  # Safe fallback if dependency missing during initial install
