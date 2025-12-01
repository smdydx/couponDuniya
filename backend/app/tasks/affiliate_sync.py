from sqlalchemy.orm import Session
from ..models import AffiliateTransaction, CashbackEvent, AffiliateClick, AffiliateMerchantMap
from ..services.affiliate_clients import AdmitadClient, VCommissionClient, CueLinksClient
from ..config import get_settings
from typing import List
import asyncio
from ..metrics import observe_affiliate_sync

settings = get_settings()

async def fetch_all():
    admitad = AdmitadClient(settings.ADMITAD_CLIENT_ID, settings.ADMITAD_CLIENT_SECRET, settings.ADMITAD_TOKEN)
    vcom = VCommissionClient(settings.VCOMMISSION_API_KEY)
    cuelinks = CueLinksClient(settings.CUELINKS_API_KEY)
    results = []
    async for tx in admitad.fetch_transactions():
        results.append(("admitad", tx))
    async for tx in vcom.fetch_transactions():
        results.append(("vcommission", tx))
    async for tx in cuelinks.fetch_transactions():
        results.append(("cuelinks", tx))
    return results

STATUS_MAP = {
    "pending": "pending",
    "approved": "confirmed",
    "confirmed": "confirmed",
    "rejected": "rejected",
    "declined": "rejected",
}

def sync_affiliate_transactions(db: Session) -> dict:
    try:
        # Use asyncio.run in thread context where no loop exists
        results = asyncio.run(fetch_all())
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            results = loop.run_until_complete(fetch_all())
        finally:
            loop.close()
    imported = 0
    updated = 0
    for network, raw in results:
        status = STATUS_MAP.get(raw.get("status", "pending"), "pending")
        external_id = raw["external_id"]
        click_ext_id = raw.get("click_ext_id")
        merchant_ext_id = raw.get("merchant_ext_id")

        existing = db.query(AffiliateTransaction).filter_by(external_transaction_id=external_id).first()
        if existing:
            if existing.status != status:
                existing.status = status
                updated += 1
                if status == "confirmed" and not existing.confirmed_at:
                    existing.confirmed_at = existing.imported_at
                    # Create cashback event if becomes confirmed
                    if existing.user_id:
                        db.add(CashbackEvent(user_id=existing.user_id, amount=existing.amount, status="confirmed"))
            continue

        click = None
        if click_ext_id:
            click = (
                db.query(AffiliateClick)
                .filter_by(external_click_id=click_ext_id)
                .order_by(AffiliateClick.id.desc())
                .first()
            )

        merchant_id = None
        if merchant_ext_id:
            m_map = (
                db.query(AffiliateMerchantMap)
                .filter_by(network=network, external_merchant_id=merchant_ext_id)
                .order_by(AffiliateMerchantMap.id.desc())
                .first()
            )
            if m_map:
                merchant_id = m_map.merchant_id

        tx = AffiliateTransaction(
            network=network,
            external_transaction_id=external_id,
            status=status,
            amount=raw.get("amount", 0) or 0,
            click_id=click.id if click else None,
            user_id=click.user_id if click else None,
            merchant_id=merchant_id,
        )
        db.add(tx)
        imported += 1
        if status == "confirmed" and tx.user_id:
            db.add(CashbackEvent(user_id=tx.user_id, amount=tx.amount, status="confirmed"))
    db.commit()
    # Metrics
    try:
        observe_affiliate_sync(imported=imported, updated=updated, total_fetched=len(results))
    except Exception:
        pass
    return {"imported": imported, "updated": updated, "total": len(results)}
