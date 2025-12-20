from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

import logging
import time
import uuid
import os

# Import config with validation
try:
    from .config_prod import get_settings, validate_production_settings
except ImportError:
    from .config import get_settings
    validate_production_settings = lambda x: []

from .api.v1 import (
    users, merchants, offers, products, orders, wallet, auth, admin, access,
    gift_cards, referrals, cashback, withdrawals, payouts, support_tickets,
    notifications, audit_logs, payments, cms_pages, sessions, kyc, inventory,
    commissions, redirects, offer_views, categories, search, cms, checkout,
    cart, health, affiliate, queue, flags, realtime, blog, blog_uploads,
    homepage, uploads, admin_referrals, social_auth, admin_kyc, seller,
)

from .database import Base, engine
from .errors import APIException, api_exception_handler, generic_exception_handler
from .redis_client import rate_limit, redis_client
from .logging_config import log, with_request_id
from .metrics import observe_request

# Initialize settings
settings = get_settings()

# Validate production settings
app_env = getattr(settings, 'APP_ENV', getattr(settings, 'ENVIRONMENT', 'development'))
if app_env == 'production':
    validation_errors = validate_production_settings(settings)
    if validation_errors:
        for error in validation_errors:
            logging.error(f"Production configuration error: {error}")
        raise RuntimeError("Production configuration validation failed")

# Create FastAPI app with security scheme for Swagger UI lock icons
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Production-grade API for coupon commerce platform. All endpoints require Bearer token authentication unless explicitly marked as public.",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
    redirect_slashes=False,
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
    },
)

# Custom validation error handler to log detailed validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Log detailed validation errors for debugging"""
    logger = logging.getLogger(__name__)
    
    # Log the request details
    logger.error(f"Validation error at {request.method} {request.url.path}")
    logger.error(f"Client: {request.client.host if request.client else 'unknown'}")
    
    # Try to log the request body
    try:
        body = await request.body()
        logger.error(f"Request body: {body.decode('utf-8')}")
    except:
        logger.error("Could not read request body")
    
    # Log the validation errors
    errors = exc.errors()
    logger.error(f"Validation errors: {errors}")
    
    # Return formatted error response
    return JSONResponse(
        status_code=422,
        content={
            "detail": errors,
            "body": jsonable_encoder(exc.body) if hasattr(exc, 'body') else None
        }
    )
# Ensure tables exist in development (no-op if already migrated)
try:
    if settings.APP_ENV != 'production':
        @app.on_event("startup")
        async def ensure_database_schema():
            if engine is not None:
                Base.metadata.create_all(bind=engine)
                
                # Create Stored Procedure
                from sqlalchemy import text
                CREATE_REFERRAL_PROC_SQL = """
                CREATE OR REPLACE FUNCTION get_admin_referrals(
                    p_limit INTEGER,
                    p_offset INTEGER,
                    p_search TEXT,
                    p_level TEXT
                )
                RETURNS TABLE (
                    id INTEGER,
                    email VARCHAR,
                    full_name VARCHAR,
                    referral_code VARCHAR,
                    referred_by_id INTEGER,
                    referred_by_name VARCHAR,
                    total_referrals BIGINT,
                    active_referrals BIGINT,
                    total_earnings NUMERIC,
                    left_child_id INTEGER,
                    right_child_id INTEGER,
                    left_child_name VARCHAR,
                    right_child_name VARCHAR,
                    created_at TIMESTAMP,
                    items_total BIGINT
                ) AS $$
                BEGIN
                    RETURN QUERY
                    WITH referral_counts AS (
                        SELECT 
                            referrer_user_id,
                            COUNT(*) as total_refs
                        FROM referrals
                        GROUP BY referrer_user_id
                    ),
                    children_info AS (
                        SELECT 
                            referrer_user_id,
                            MAX(CASE WHEN child_rank = 1 THEN referred_user_id END) as left_id,
                            MAX(CASE WHEN child_rank = 2 THEN referred_user_id END) as right_id
                        FROM (
                            SELECT 
                                referrer_user_id,
                                referred_user_id,
                                ROW_NUMBER() OVER (PARTITION BY referrer_user_id ORDER BY created_at) as child_rank
                            FROM referrals
                        ) ranked
                        WHERE child_rank <= 2
                        GROUP BY referrer_user_id
                    ),
                    filtered_users AS (
                        SELECT u.*, r_ref.referrer_user_id as parent_id
                        FROM users u
                        LEFT JOIN referrals r_ref ON u.id = r_ref.referred_user_id
                        WHERE 
                            (p_search IS NULL OR p_search = '' OR 
                             u.email ILIKE '%' || p_search || '%' OR 
                             u.full_name ILIKE '%' || p_search || '%' OR
                             u.referral_code ILIKE '%' || p_search || '%')
                    ),
                    total_count AS (
                        SELECT COUNT(*) as cnt FROM filtered_users
                    )
                    SELECT 
                        u.id,
                        u.email,
                        u.full_name,
                        u.referral_code,
                        u.parent_id,
                        u_parent.full_name as referred_by_name,
                        COALESCE(rc.total_refs, 0) as total_referrals,
                        COALESCE(rc.total_refs, 0) as active_referrals,
                        COALESCE(u.total_earnings, 0) as total_earnings,
                        ci.left_id,
                        ci.right_id,
                        u_left.full_name as left_child_name,
                        u_right.full_name as right_child_name,
                        u.created_at,
                        tc.cnt
                    FROM filtered_users u
                    LEFT JOIN users u_parent ON u.parent_id = u_parent.id
                    LEFT JOIN referral_counts rc ON u.id = rc.referrer_user_id
                    LEFT JOIN children_info ci ON u.id = ci.referrer_user_id
                    LEFT JOIN users u_left ON ci.left_id = u_left.id
                    LEFT JOIN users u_right ON ci.right_id = u_right.id
                    CROSS JOIN total_count tc
                    ORDER BY u.created_at DESC
                    LIMIT p_limit
                    OFFSET p_offset;
                END;
                $$ LANGUAGE plpgsql;
                """
                with engine.connect() as conn:
                    conn.execute(text(CREATE_REFERRAL_PROC_SQL))
                    conn.commit()
                    log.info("✅ Stored procedure 'get_admin_referrals' created/updated")
except Exception:
    pass

# Production health check
@app.on_event("startup")
async def startup_health_check():
    """Verify critical services on startup"""
    app_env = getattr(settings, 'APP_ENV', getattr(settings, 'ENVIRONMENT', 'development'))
    if app_env == 'production':
        # Test database connection
        if engine is not None:
            with engine.connect() as conn:
                conn.execute("SELECT 1")
                log.info("✅ Database connection verified")

        # Test Redis connection
        redis_client.ping()
        log.info("✅ Redis connection verified")

        log.info(f"🚀 {settings.APP_NAME} started successfully in {app_env} mode")
    else:
        log.info(f"🚀 {settings.APP_NAME} started in {app_env} mode (development)")


# CORS - Allow development and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:3000",
        "http://127.0.0.1:5000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://0.0.0.0:5000",
        "http://0.0.0.0:3000",
        "https://b9df0ce0-80cb-4d8d-83a2-e12bcc6f831c-00-7l6kkbk0zswa.kirk.replit.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Authorization", "Content-Type"],
    expose_headers=["*"],
    max_age=3600,
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
    client_ip = request.client.host if request.client else "unknown"
    start = time.time()
    allowed, remaining, ttl = rate_limit(client_ip,
                                         limit=100,
                                         window_seconds=60)
    if not allowed:
        raise HTTPException(status_code=429,
                            detail="Too many requests. Slow down.")
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    logger = with_request_id(log, request_id)
    response = await call_next(request)
    duration = time.time() - start
    try:
        observe_request(request.method, request.url.path, response.status_code,
                        duration)
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
    response.headers.setdefault("Referrer-Policy",
                                "strict-origin-when-cross-origin")
    response.headers.setdefault("X-XSS-Protection",
                                "0")  # Modern browsers ignore; CSP recommended

    # Relaxed CSP for /docs and /api/openapi.json endpoints to allow Swagger UI
    if request.url.path in ["/docs", "/api/docs", "/api/openapi.json", "/openapi.json"]:
        response.headers.setdefault(
            "Content-Security-Policy", 
            "default-src 'self'; "
            "img-src 'self' data: https://fastapi.tiangolo.com https://cdn.jsdelivr.net; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "font-src 'self' https://cdn.jsdelivr.net; "
            "connect-src 'self'"
        )
    else:
        # Minimal CSP for other endpoints
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'"
        )
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

# Periodic affiliate sync scheduler (disabled for Replit to avoid event loop conflicts)
# To enable, set AFFILIATE_SYNC_ENABLED=true and ensure sync_affiliate_transactions is async
try:
    from .tasks.affiliate_sync import sync_affiliate_transactions
    from .database import SessionLocal
    AFFILIATE_INTERVAL_MINUTES = float(
        os.getenv("AFFILIATE_SYNC_INTERVAL_MINUTES", "1440"))  # default daily
    AFFILIATE_SYNC_ENABLED = os.getenv("AFFILIATE_SYNC_ENABLED",
                                       "false").lower() == "true"

    async def affiliate_sync_scheduler():
        while True:
            start_ts = time.time()
            if SessionLocal is not None:
                session = SessionLocal()
                try:
                    result = sync_affiliate_transactions(session)
                    log.info(
                        f"Affiliate periodic sync imported={result['imported']} updated={result['updated']} total={result['total']}"
                    )
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
        # Skip if disabled or interval set to 0 or negative
        if AFFILIATE_SYNC_ENABLED and AFFILIATE_INTERVAL_MINUTES > 0:
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
app.include_router(admin_referrals.router, prefix="/api/v1")
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
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(social_auth.router, prefix="/api/v1")
app.include_router(admin_kyc.router, prefix="/api/v1")
app.include_router(seller.router, prefix="/api/v1")
app.add_middleware(GZipMiddleware, minimum_size=500)
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
    ("Seller", ["Seller"]),
]


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version="1.0.0",
        description="Secured API for coupon commerce platform. All endpoints require Bearer token authentication (lock icon indicates protected endpoints).",
        routes=app.routes,
    )

    # Add security scheme for Bearer token authentication (shows lock icon in Swagger)
    openapi_schema["components"] = openapi_schema.get("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT access token to authenticate. Get token from /api/v1/auth/login endpoint."
        }
    }

    # Apply security globally to all endpoints (shows lock icon on all routes)
    openapi_schema["security"] = [{"BearerAuth": []}]

    # Group tags for organized documentation
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


@app.get("/openapi.json", include_in_schema=False)
def get_openapi_json():
    return app.openapi()


@app.get("/docs", include_in_schema=False)
def custom_docs():
    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title=f"{settings.APP_NAME} Docs",
    )


@app.get("/health", tags=["System"])
def health():
    return {"status": "ok"}


# Prometheus instrumentation
try:
    from prometheus_fastapi_instrumentator import Instrumentator
    Instrumentator().instrument(app).expose(app, include_in_schema=False)
except Exception:
    pass  # Safe fallback if dependency missing during initial install