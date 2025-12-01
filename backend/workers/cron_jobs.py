"""Cron Jobs Worker - Handles scheduled maintenance tasks.

This worker runs periodic jobs:
1. Expire old offers (daily 2 AM)
2. Recalculate wallet balances (daily 3 AM)
3. Clean old logs (weekly)
4. Generate sitemap (daily 4 AM)

Usage:
    python -m workers.cron_jobs
"""
from __future__ import annotations

import logging
import sys
from datetime import datetime, timedelta, timezone

import schedule
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.merchant import Offer
from app.models.wallet import WalletBalance, WalletTransaction
from app.models.admin import AuditLog
from app.redis_client import redis_client, rk

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

CRON_LOCK_PREFIX = "lock:cron:"


def with_lock(job_name: str, timeout: int = 3600):
    """Decorator to ensure only one instance of a job runs at a time."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            lock_key = rk(CRON_LOCK_PREFIX, job_name)
            lock_acquired = redis_client.set(lock_key, "locked", nx=True, ex=timeout)
            
            if not lock_acquired:
                logger.warning(f"Job {job_name} is already running, skipping...")
                return
            
            try:
                return func(*args, **kwargs)
            finally:
                redis_client.delete(lock_key)
        
        return wrapper
    return decorator


@with_lock("expire_offers", timeout=1800)
def expire_old_offers():
    """Mark expired offers as inactive."""
    logger.info("=== Expiring Old Offers ===")
    
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        # Update expired offers
        stmt = (
            update(Offer)
            .where(Offer.expires_at < now)
            .where(Offer.is_active == True)
            .values(is_active=False)
        )
        
        result = db.execute(stmt)
        db.commit()
        
        expired_count = result.rowcount
        logger.info(f"Expired {expired_count} offers")
        
        # Invalidate cache
        redis_client.delete(rk("cache", "offers", "*"))
        
    except Exception as e:
        logger.error(f"Failed to expire offers: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


@with_lock("recalc_wallets", timeout=3600)
def recalculate_wallet_balances():
    """Verify and recalculate wallet balances for integrity."""
    logger.info("=== Recalculating Wallet Balances ===")
    
    db = SessionLocal()
    try:
        # Get all wallets
        wallets = db.execute(select(WalletBalance)).scalars().all()
        
        fixed_count = 0
        for wallet in wallets:
            # Sum all transactions
            stmt = select(WalletTransaction).where(
                WalletTransaction.user_id == wallet.user_id
            ).order_by(WalletTransaction.created_at)
            
            transactions = db.execute(stmt).scalars().all()
            
            calculated_balance = 0.0
            for txn in transactions:
                if txn.type in ["credit", "cashback", "refund"]:
                    calculated_balance += txn.amount
                elif txn.type in ["debit", "withdrawal"]:
                    calculated_balance -= txn.amount
            
            # Check if balance matches
            if abs(wallet.balance - calculated_balance) > 0.01:
                logger.warning(
                    f"Wallet {wallet.user_id} balance mismatch: "
                    f"stored={wallet.balance}, calculated={calculated_balance}"
                )
                wallet.balance = calculated_balance
                fixed_count += 1
        
        db.commit()
        logger.info(f"Fixed {fixed_count} wallet balances")
        
    except Exception as e:
        logger.error(f"Failed to recalculate wallet balances: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


@with_lock("clean_logs", timeout=1800)
def clean_old_logs():
    """Delete old audit logs (older than 90 days)."""
    logger.info("=== Cleaning Old Logs ===")
    
    db = SessionLocal()
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=90)
        
        # Delete old audit logs
        result = db.execute(
            select(AuditLog).where(AuditLog.created_at < cutoff_date)
        )
        old_logs = result.scalars().all()
        
        for log in old_logs:
            db.delete(log)
        
        db.commit()
        
        deleted_count = len(old_logs)
        logger.info(f"Deleted {deleted_count} old audit logs")
        
    except Exception as e:
        logger.error(f"Failed to clean logs: {e}", exc_info=True)
        db.rollback()
    finally:
        db.close()


@with_lock("generate_sitemap", timeout=1800)
def generate_sitemap():
    """Generate XML sitemap for SEO."""
    logger.info("=== Generating Sitemap ===")
    
    db = SessionLocal()
    try:
        from app.models.merchant import Merchant
        from app.models.product import Product
        
        # Get all active merchants
        merchants = db.execute(
            select(Merchant).where(Merchant.is_active == True)
        ).scalars().all()
        
        # Get all active offers
        offers = db.execute(
            select(Offer).where(Offer.is_active == True)
        ).scalars().all()
        
        # Get all active products
        products = db.execute(
            select(Product).where(Product.is_active == True)
        ).scalars().all()
        
        # Generate sitemap XML
        sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        sitemap_xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        
        # Add homepage
        sitemap_xml += '  <url>\n'
        sitemap_xml += '    <loc>https://couponali.com/</loc>\n'
        sitemap_xml += '    <changefreq>daily</changefreq>\n'
        sitemap_xml += '    <priority>1.0</priority>\n'
        sitemap_xml += '  </url>\n'
        
        # Add merchant pages
        for merchant in merchants:
            sitemap_xml += '  <url>\n'
            sitemap_xml += f'    <loc>https://couponali.com/merchants/{merchant.slug}</loc>\n'
            sitemap_xml += '    <changefreq>weekly</changefreq>\n'
            sitemap_xml += '    <priority>0.8</priority>\n'
            sitemap_xml += '  </url>\n'
        
        # Add product pages
        for product in products:
            sitemap_xml += '  <url>\n'
            sitemap_xml += f'    <loc>https://couponali.com/products/{product.slug}</loc>\n'
            sitemap_xml += '    <changefreq>weekly</changefreq>\n'
            sitemap_xml += '    <priority>0.7</priority>\n'
            sitemap_xml += '  </url>\n'
        
        sitemap_xml += '</urlset>'
        
        # Save to file (or upload to S3)
        # For now, just log the count
        logger.info(
            f"Generated sitemap with {len(merchants)} merchants, "
            f"{len(offers)} offers, {len(products)} products"
        )
        
        # TODO: Save sitemap_xml to public/sitemap.xml or upload to CDN
        
    except Exception as e:
        logger.error(f"Failed to generate sitemap: {e}", exc_info=True)
    finally:
        db.close()


def run_scheduler():
    """Run all scheduled jobs."""
    logger.info("Starting cron jobs scheduler...")
    
    # Schedule jobs
    schedule.every().day.at("02:00").do(expire_old_offers)
    schedule.every().day.at("03:00").do(recalculate_wallet_balances)
    schedule.every().day.at("04:00").do(generate_sitemap)
    schedule.every().sunday.at("01:00").do(clean_old_logs)
    
    logger.info("Scheduled jobs:")
    logger.info("  - Expire old offers: Daily at 02:00 UTC")
    logger.info("  - Recalculate wallet balances: Daily at 03:00 UTC")
    logger.info("  - Generate sitemap: Daily at 04:00 UTC")
    logger.info("  - Clean old logs: Weekly (Sunday) at 01:00 UTC")
    
    # Run immediately on startup (for testing)
    # Uncomment to run all jobs on startup:
    # expire_old_offers()
    # recalculate_wallet_balances()
    # generate_sitemap()
    
    # Keep running
    import time
    while True:
        try:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            break
        except Exception as e:
            logger.error(f"Scheduler error: {e}", exc_info=True)
            time.sleep(60)


def main():
    """Main entry point."""
    run_scheduler()


if __name__ == "__main__":
    main()
