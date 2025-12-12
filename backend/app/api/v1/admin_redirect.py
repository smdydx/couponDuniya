"""Affiliate redirect and tracking endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from datetime import datetime, timedelta
import uuid
import requests

from ...database import get_db
from ...models import Merchant, Offer, OfferClick, User
from ...redis_client import cache_get, cache_set, rk
from ...dependencies import rate_limit_dependency, get_current_user

router = APIRouter(prefix="/go", tags=["Affiliate Redirect"])


@router.get("/{merchant_slug}")
def affiliate_redirect(
    merchant_slug: str,
    offer_id: int = Query(None),
    user_id: int = Query(None),
    db: Session = Depends(get_db),
    _: dict = Depends(rate_limit_dependency("redirect:click", limit=100, window_seconds=60))
):
    """
    Redirect user through affiliate tracking URL
    
    **Flow:**
    1. Record click with tracking ID
    2. Generate affiliate tracking URL with parameters
    3. Redirect to affiliate network
    4. Affiliate network redirects to merchant
    
    **Example:**
    GET /go/amazon?offer_id=22
    
    **Response:**
    Permanent redirect (308) to tracking URL with parameters
    """
    
    # Get merchant
    merchant = db.scalar(select(Merchant).where(Merchant.slug == merchant_slug))
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # Validate merchant is active and approved
    if merchant.status != 'approved':
        raise HTTPException(status_code=400, detail="Merchant is not available for redirection")

    if not merchant.is_active:
        raise HTTPException(status_code=400, detail="Merchant is inactive")

    # Check if merchant has tracking URL
    if not merchant.tracking_url:
        raise HTTPException(status_code=400, detail="Merchant does not have tracking URL configured")

    # Get offer if specified
    offer = None
    if offer_id:
        offer = db.scalar(select(Offer).where(
            Offer.id == offer_id,
            Offer.merchant_id == merchant.id,
            Offer.is_active == True
        ))
        if not offer_id and offer_id != 0:  # offer_id was specified but not found
            raise HTTPException(status_code=404, detail="Offer not found")

    # Create click tracking record
    click_id = str(uuid.uuid4())
    click_timestamp = datetime.utcnow()

    try:
        # Record the click
        if offer:
            click_record = OfferClick(
                offer_id=offer_id,
                user_id=user_id,
                click_id=click_id,
                ip_address=None,  # TODO: Extract from request
                user_agent=None,  # TODO: Extract from headers
                referrer=None,    # TODO: Extract from headers
                clicked_at=click_timestamp,
            )
            db.add(click_record)
            db.commit()

        # Build tracking URL with parameters
        # Append click tracking ID and user ID to tracking URL
        separator = "&" if "?" in merchant.tracking_url else "?"
        tracking_params = f"{separator}click_id={click_id}"
        
        if user_id:
            tracking_params += f"&user_id={user_id}"
        
        if offer_id:
            tracking_params += f"&offer_id={offer_id}"
        
        if merchant.affiliate_network_id:
            tracking_params += f"&campaign_id={merchant.affiliate_network_id}"

        final_url = merchant.tracking_url + tracking_params

        # Log for analytics
        cache_set(rk("click_tracking", click_id), {
            "merchant_id": merchant.id,
            "offer_id": offer_id,
            "user_id": user_id,
            "timestamp": click_timestamp.isoformat(),
        }, 86400)  # Keep for 24 hours

        # Return permanent redirect
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=final_url, status_code=308)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redirect failed: {str(e)}")


@router.post("/webhook/affiliate-callback")
def affiliate_callback_webhook(
    request_body: dict,
    db: Session = Depends(get_db),
):
    """
    Receive callbacks from affiliate networks about successful transactions
    
    **Webhook payload should contain:**
    - transaction_id: Unique transaction ID from affiliate network
    - click_id: Our tracking click ID (passed during redirect)
    - user_id: couponDuniya user ID
    - order_amount: Transaction amount
    - commission: Commission earned
    - status: 'pending' | 'confirmed' | 'approved'
    - merchant_id: Merchant ID
    
    **This endpoint will:**
    1. Validate the transaction
    2. Create affiliate transaction record
    3. Update wallet if approved
    4. Handle different status transitions
    """
    
    try:
        transaction_id = request_body.get('transaction_id')
        click_id = request_body.get('click_id')
        user_id = request_body.get('user_id')
        order_amount = request_body.get('order_amount', 0)
        commission = request_body.get('commission', 0)
        status = request_body.get('status', 'pending')
        merchant_id = request_body.get('merchant_id')

        # Validate required fields
        if not all([transaction_id, user_id, merchant_id]):
            raise ValueError("Missing required fields: transaction_id, user_id, merchant_id")

        # Get user
        user = db.scalar(select(User).where(User.id == user_id))
        if not user:
            raise ValueError(f"User {user_id} not found")

        # Get merchant
        merchant = db.scalar(select(Merchant).where(Merchant.id == merchant_id))
        if not merchant:
            raise ValueError(f"Merchant {merchant_id} not found")

        # Check if transaction already exists
        from ...models import AffiliateTransaction
        existing = db.scalar(
            select(AffiliateTransaction).where(
                AffiliateTransaction.transaction_id == transaction_id
            )
        )
        if existing:
            # Update status if it changed
            existing.status = status
            existing.updated_at = datetime.utcnow()
            db.commit()
            return {"success": True, "message": "Transaction updated"}

        # Create affiliate transaction record
        affiliate_tx = AffiliateTransaction(
            transaction_id=transaction_id,
            merchant_id=merchant_id,
            user_id=user_id,
            click_id=click_id,
            order_amount=order_amount,
            commission=commission,
            status=status,
            network=merchant.affiliate_network,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(affiliate_tx)
        db.flush()

        # If status is approved, add to wallet
        if status == 'approved' and commission > 0:
            from ...models import Wallet, WalletTransaction
            
            wallet = db.scalar(select(Wallet).where(Wallet.user_id == user_id))
            if not wallet:
                wallet = Wallet(user_id=user_id, balance=commission)
                db.add(wallet)
                db.flush()
            else:
                wallet.balance += commission

            # Create wallet transaction record
            wallet_tx = WalletTransaction(
                wallet_id=wallet.id,
                transaction_type='credit',
                amount=commission,
                description=f"Cashback from {merchant.name} purchase (Transaction: {transaction_id})",
                reference_type='affiliate_transaction',
                reference_id=affiliate_tx.id,
                status='completed',
                created_at=datetime.utcnow(),
            )
            db.add(wallet_tx)

        db.commit()

        return {
            "success": True,
            "message": f"Transaction {transaction_id} processed successfully",
            "affiliate_transaction_id": affiliate_tx.id,
        }

    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "error": str(e),
        }


@router.get("/health/click-tracking")
def health_check():
    """Health check for click tracking system"""
    return {
        "status": "healthy",
        "service": "affiliate-redirect",
        "timestamp": datetime.utcnow().isoformat(),
    }
