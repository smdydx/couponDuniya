"""
CouponAli Backend - Main Application Entry Point
=================================================
Production-grade FastAPI application for coupon & cashback platform.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi

import logging
import time
import uuid
import os
import asyncio
from pathlib import Path

from .config import get_settings
from .database import Base, engine
from .errors import APIException, api_exception_handler, generic_exception_handler
from .redis_client import rate_limit, redis_client
from .logging_config import log, with_request_id
from .metrics import observe_request, set_redis_memory, set_dead_letter

# Import API routers (Coupon-focused only)
from .api.v1 import (
    # Auth & Users
    auth,
    users,
    sessions,
    social_auth,
    two_factor,
    kyc,
    
    # Merchants & Offers
    merchants,
    offers,
    categories,
    gift_cards,
    
    # Wallet & Cashback
    wallet,
    cashback,
    withdrawals,
    payouts,
    
    # Referrals & Affiliates
    referrals,
    affiliate,
    commissions,
    
    # Homepage & Content
    homepage,
    newsletter,
    
    # Admin
    admin,
    admin_referrals,
    admin_support,
    access,
    audit_logs,
    
    # Notifications & Support
    notifications,
    push,
    support_tickets,
    
    # System
    health,
    uploads,
    queue,
    realtime,
    flags,
    offer_views,
)

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="Professional Coupon & Cashback Platform API. Focus: Merchants, Offers, Gift Cards, Wallet, Referrals.",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    openapi_url="/api/openapi.json" if settings.DEBUG else None,
    redirect_slashes=False,
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
    },
)

# Database initialization
try:
    if settings.APP_ENV != 'production':
        @app.on_event("startup")
        async def ensure_database_schema():
            if engine is not None:
                Base.metadata.create_all(bind=engine)
except Exception:
    pass

@app.on_event("startup")
async def startup_health_check():
    app_env = getattr(settings, 'APP_ENV', 'development')
    log.info(f"🚀 CouponAli API started in {app_env} mode ({app_env})")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path == "/health" or request.url.path.startswith("/docs"):
        return await call_next(request)
    client_ip = request.client.host if request.client else "unknown"
    start = time.time()
    allowed, remaining, ttl = rate_limit(client_ip, limit=100, window_seconds=60)
    if not allowed:
        raise HTTPException(status_code=429, detail="Too many requests. Slow down.")
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
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

@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    return response

# Include API Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(social_auth.router, prefix="/api/v1")
app.include_router(two_factor.router, prefix="/api/v1")
app.include_router(kyc.router, prefix="/api/v1")
app.include_router(merchants.router, prefix="/api/v1")
app.include_router(offers.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(gift_cards.router, prefix="/api/v1")
app.include_router(wallet.router, prefix="/api/v1")
app.include_router(cashback.router, prefix="/api/v1")
app.include_router(withdrawals.router, prefix="/api/v1")
app.include_router(payouts.router, prefix="/api/v1")
app.include_router(referrals.router, prefix="/api/v1")
app.include_router(affiliate.router, prefix="/api/v1")
app.include_router(commissions.router, prefix="/api/v1")
app.include_router(homepage.router, prefix="/api/v1")
app.include_router(newsletter.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(admin_referrals.router, prefix="/api/v1")
app.include_router(admin_support.router, prefix="/api/v1")
app.include_router(access.router, prefix="/api/v1")
app.include_router(audit_logs.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(push.router, prefix="/api/v1")
app.include_router(support_tickets.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(queue.router, prefix="/api/v1")
app.include_router(realtime.router, prefix="/api/v1")
app.include_router(flags.router, prefix="/api/v1")
app.include_router(offer_views.router, prefix="/api/v1")

app.add_middleware(GZipMiddleware, minimum_size=500)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=settings.APP_NAME,
        version="2.0.0",
        description="Professional Coupon & Cashback Platform API",
        routes=app.routes,
    )
    openapi_schema["components"] = openapi_schema.get("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    openapi_schema["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.mount("/images", StaticFiles(directory="app/images"), name="images")
Path("uploads").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/openapi.json", include_in_schema=False)
def get_openapi_json():
    return app.openapi()

@app.get("/docs", include_in_schema=False)
def custom_docs():
    return get_swagger_ui_html(openapi_url="/openapi.json", title=f"{settings.APP_NAME} Docs")

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "version": "2.0.0"}
