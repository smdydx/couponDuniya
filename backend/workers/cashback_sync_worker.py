"""Cashback Sync Worker - Imports affiliate transactions and creates cashback events.

This worker:
1. Fetches transactions from affiliate networks (Admitad, VCommission, CueLinks)
2. Maps transactions to users via click tracking
3. Creates cashback_events with pending status
4. Optionally auto-approves based on rules
5. Runs on a schedule (daily at 2 AM or triggered manually)

Usage:
    # Run once
    python -m workers.cashback_sync_worker --once
    
    # Run as daemon (scheduled)
    python -m workers.cashback_sync_worker

Environment Variables:
    ADMITAD_CLIENT_ID, ADMITAD_CLIENT_SECRET, ADMITAD_REFRESH_TOKEN
    VCOMMISSION_API_KEY
    CUELINKS_API_KEY, CUELINKS_PUBLISHER_ID
"""
from __future__ import annotations

import asyncio
import logging
import sys
from datetime import datetime, timedelta, timezone
from typing import Optional

import schedule
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.affiliate import AffiliateClick, AffiliateMerchantMap, AffiliateTransaction
from app.models.cashback import CashbackEvent
from app.models.wallet import WalletBalance
from app.redis_client import redis_client, rk
from app.services.affiliate_clients import (
    fetch_admitad_transactions,
    fetch_cuelinks_transactions,
    fetch_vcommission_transactions,
)
from app.services.affiliate_sync import import_affiliate_transactions

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

SYNC_LOCK_KEY = rk("lock", "cashback_sync")
SYNC_LOCK_TIMEOUT = 3600  # 1 hour lock timeout


async def sync_affiliate_transactions(db: Session, days_back: int = 7) -> dict:
    """Fetch and import transactions from all affiliate networks.
    
    Args:
        db: Database session
        days_back: Number of days to look back for transactions
        
    Returns:
        dict: Summary of import results
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=days_back)
    end_date = datetime.now(timezone.utc)
    
    logger.info(f"Starting affiliate sync from {start_date} to {end_date}")
    
    results = {
        "admitad": {"imported": 0, "errors": 0},
        "vcommission": {"imported": 0, "errors": 0},
        "cuelinks": {"imported": 0, "errors": 0},
        "total_cashback_events": 0,
    }
    
    # Fetch from Admitad
    try:
        logger.info("Fetching Admitad transactions...")
        admitad_count = 0
        async for transaction in fetch_admitad_transactions(start_date, end_date):
            try:
                await import_affiliate_transactions(db, [transaction], "admitad")
                admitad_count += 1
            except Exception as e:
                logger.error(f"Failed to import Admitad transaction {transaction.get('id')}: {e}")
                results["admitad"]["errors"] += 1
        
        results["admitad"]["imported"] = admitad_count
        logger.info(f"Imported {admitad_count} Admitad transactions")
    except Exception as e:
        logger.error(f"Admitad sync failed: {e}")
        results["admitad"]["errors"] += 1
    
    # Fetch from VCommission
    try:
        logger.info("Fetching VCommission transactions...")
        vcommission_count = 0
        async for transaction in fetch_vcommission_transactions(start_date, end_date):
            try:
                await import_affiliate_transactions(db, [transaction], "vcommission")
                vcommission_count += 1
            except Exception as e:
                logger.error(f"Failed to import VCommission transaction {transaction.get('id')}: {e}")
                results["vcommission"]["errors"] += 1
        
        results["vcommission"]["imported"] = vcommission_count
        logger.info(f"Imported {vcommission_count} VCommission transactions")
    except Exception as e:
        logger.error(f"VCommission sync failed: {e}")
        results["vcommission"]["errors"] += 1
    
    # Fetch from CueLinks
    try:
        logger.info("Fetching CueLinks transactions...")
        cuelinks_count = 0
        async for transaction in fetch_cuelinks_transactions(start_date, end_date):
            try:
                await import_affiliate_transactions(db, [transaction], "cuelinks")
                cuelinks_count += 1
            except Exception as e:
                logger.error(f"Failed to import CueLinks transaction {transaction.get('id')}: {e}")
                results["cuelinks"]["errors"] += 1
        
        results["cuelinks"]["imported"] = cuelinks_count
        logger.info(f"Imported {cuelinks_count} CueLinks transactions")
    except Exception as e:
        logger.error(f"CueLinks sync failed: {e}")
        results["cuelinks"]["errors"] += 1
    
    # Count total cashback events created
    total_cashback = await process_pending_cashback(db)
    results["total_cashback_events"] = total_cashback
    
    return results


async def process_pending_cashback(db: Session) -> int:
    """Process pending affiliate transactions and create cashback events.
    
    Returns:
        int: Number of cashback events created
    """
    logger.info("Processing pending affiliate transactions...")
    
    # Find transactions without cashback events
    stmt = (
        select(AffiliateTransaction)
        .outerjoin(CashbackEvent, AffiliateTransaction.id == CashbackEvent.affiliate_transaction_id)
        .where(CashbackEvent.id.is_(None))
        .where(AffiliateTransaction.status == "approved")
    )
    
    transactions = db.execute(stmt).scalars().all()
    
    cashback_count = 0
    for transaction in transactions:
        try:
            # Find matching click to get user_id
            click = db.execute(
                select(AffiliateClick).where(
                    AffiliateClick.external_click_id == transaction.external_transaction_id
                )
            ).scalar_one_or_none()
            
            if not click or not click.user_id:
                logger.warning(f"No matching click found for transaction {transaction.external_transaction_id}")
                continue
            
            # Calculate cashback amount (e.g., 70% of commission)
            cashback_amount = transaction.commission_amount * 0.70
            
            # Create cashback event
            cashback_event = CashbackEvent(
                user_id=click.user_id,
                merchant_id=transaction.merchant_id,
                offer_id=click.offer_id,
                affiliate_transaction_id=transaction.id,
                amount=cashback_amount,
                status="pending",
                source=transaction.network,
                transaction_date=transaction.transaction_date,
            )
            
            db.add(cashback_event)
            cashback_count += 1
            
            logger.info(
                f"Created cashback event: user={click.user_id}, "
                f"amount={cashback_amount}, transaction={transaction.external_transaction_id}"
            )
        
        except Exception as e:
            logger.error(f"Failed to create cashback event for transaction {transaction.id}: {e}")
            continue
    
    db.commit()
    logger.info(f"Created {cashback_count} cashback events")
    
    return cashback_count


async def auto_approve_cashback(db: Session) -> int:
    """Auto-approve cashback events based on rules.
    
    Returns:
        int: Number of cashback events approved
    """
    logger.info("Auto-approving eligible cashback events...")
    
    # Get pending cashback events older than 30 days
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
    
    stmt = (
        select(CashbackEvent)
        .where(CashbackEvent.status == "pending")
        .where(CashbackEvent.created_at < cutoff_date)
    )
    
    pending_events = db.execute(stmt).scalars().all()
    
    approved_count = 0
    for event in pending_events:
        try:
            # Update cashback status
            event.status = "confirmed"
            event.confirmed_at = datetime.now(timezone.utc)
            
            # Add to wallet
            wallet = db.execute(
                select(WalletBalance).where(WalletBalance.user_id == event.user_id)
            ).scalar_one()
            
            wallet.balance += event.amount
            
            approved_count += 1
            
            logger.info(
                f"Auto-approved cashback: user={event.user_id}, "
                f"amount={event.amount}, event={event.id}"
            )
        
        except Exception as e:
            logger.error(f"Failed to auto-approve cashback event {event.id}: {e}")
            continue
    
    db.commit()
    logger.info(f"Auto-approved {approved_count} cashback events")
    
    return approved_count


def run_sync_job():
    """Run the sync job with distributed lock."""
    # Acquire distributed lock
    lock_acquired = redis_client.set(
        SYNC_LOCK_KEY, "locked", nx=True, ex=SYNC_LOCK_TIMEOUT
    )
    
    if not lock_acquired:
        logger.warning("Another sync job is already running, skipping...")
        return
    
    try:
        logger.info("=== Starting Cashback Sync Job ===")
        
        db = SessionLocal()
        try:
            # Run sync
            results = asyncio.run(sync_affiliate_transactions(db, days_back=7))
            
            logger.info("=== Sync Results ===")
            logger.info(f"Admitad: {results['admitad']['imported']} imported, {results['admitad']['errors']} errors")
            logger.info(f"VCommission: {results['vcommission']['imported']} imported, {results['vcommission']['errors']} errors")
            logger.info(f"CueLinks: {results['cuelinks']['imported']} imported, {results['cuelinks']['errors']} errors")
            logger.info(f"Total cashback events created: {results['total_cashback_events']}")
            
            # Auto-approve old cashback
            approved = asyncio.run(auto_approve_cashback(db))
            logger.info(f"Auto-approved: {approved} cashback events")
            
        finally:
            db.close()
        
        logger.info("=== Cashback Sync Job Completed ===")
    
    except Exception as e:
        logger.error(f"Sync job failed: {e}", exc_info=True)
    
    finally:
        # Release lock
        redis_client.delete(SYNC_LOCK_KEY)


def run_scheduler():
    """Run the scheduler as a daemon."""
    logger.info("Starting cashback sync scheduler...")
    logger.info("Scheduled to run daily at 02:00 UTC")
    
    # Schedule daily run at 2 AM
    schedule.every().day.at("02:00").do(run_sync_job)
    
    # Run immediately on startup
    logger.info("Running initial sync...")
    run_sync_job()
    
    # Keep running
    while True:
        try:
            schedule.run_pending()
            asyncio.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("Scheduler stopped by user")
            break
        except Exception as e:
            logger.error(f"Scheduler error: {e}", exc_info=True)
            asyncio.sleep(60)


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Cashback Sync Worker")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run sync once and exit (instead of as daemon)",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=7,
        help="Number of days to look back for transactions (default: 7)",
    )
    
    args = parser.parse_args()
    
    if args.once:
        logger.info("Running sync once...")
        run_sync_job()
    else:
        run_scheduler()


if __name__ == "__main__":
    main()
