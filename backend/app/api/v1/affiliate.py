from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ...database import get_db
from ...tasks.affiliate_sync import sync_affiliate_transactions
from ...models import AffiliateTransaction

router = APIRouter(tags=["Affiliate"], prefix="/affiliate")

@router.post("/sync", summary="Manual affiliate sync trigger")
def trigger_affiliate_sync(db: Session = Depends(get_db)):
    result = sync_affiliate_transactions(db)
    return {"status": "ok", **result}

@router.get("/transactions", summary="List affiliate transactions")
def list_affiliate_transactions(
    status: str | None = Query(None),
    network: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(AffiliateTransaction).order_by(AffiliateTransaction.id.desc())
    if status:
        q = q.filter(AffiliateTransaction.status == status)
    if network:
        q = q.filter(AffiliateTransaction.network == network)
    rows = q.limit(limit).all()
    return {
        "items": [
            {
                "id": r.id,
                "network": r.network,
                "status": r.status,
                "amount": float(r.amount or 0),
                "user_id": r.user_id,
                "merchant_id": r.merchant_id,
                "click_id": r.click_id,
                "external_transaction_id": r.external_transaction_id,
            }
            for r in rows
        ],
        "count": len(rows),
    }
