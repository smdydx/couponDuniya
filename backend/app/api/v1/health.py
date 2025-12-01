"""Health check and monitoring endpoints"""
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from ...database import get_db
from ...queue import get_queue_stats
from ...redis_client import redis_client

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check(db: Session = Depends(get_db)):
    """Basic health check for API and database"""
    try:
        # Check database connection
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "service": "coupon-commerce-api"
    }


@router.get("/redis")
async def redis_health():
    """Redis health check with queue statistics (updated structure)."""
    try:
        redis_client.ping()
        stats = get_queue_stats()
        return {
            "status": "healthy",
            "redis": "connected",
            "queues": stats,
            "total": {
                "pending": stats["email"]["pending"] + stats["sms"]["pending"],
                "processing": stats["email"]["processing"] + stats["sms"]["processing"],
                "dead_letter": stats["email"]["dead_letter"] + stats["sms"]["dead_letter"],
            },
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "redis": f"error: {str(e)}",
            "queues": None,
        }
