from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_, desc
from datetime import datetime, timedelta
from typing import Optional
from decimal import Decimal

from ...database import get_db
from ...models import User, WalletTransaction, Withdrawal
from ...schemas.wallet_transaction import (
    WalletTransactionRead,
    WalletTransactionFilters,
    WalletSummary,
    WithdrawalRequestCreate,
    WithdrawalRead,
    WithdrawalStatusUpdate,
    CashbackConversionRequest
)
from ...dependencies import get_current_user
from ...queue import push_email_job, push_sms_job
from ...config import get_settings
from ...redis_client import redis_client

router = APIRouter(prefix="/wallet", tags=["Wallet"])

settings = get_settings()

def acquire_lock(key: str, timeout: int = 10) -> bool:
    """Acquire a distributed lock using Redis"""
    lock_key = f"lock:{key}"
    return redis_client.set(lock_key, "1", nx=True, ex=timeout)

def release_lock(key: str):
    """Release a distributed lock"""
    lock_key = f"lock:{key}"
    redis_client.delete(lock_key)


@router.get("/", response_model=dict)
def get_wallet_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get wallet balance and summary"""
    
    # Calculate lifetime earnings (all positive transactions)
    lifetime_earnings = db.scalar(
        select(func.coalesce(func.sum(WalletTransaction.amount), 0))
        .where(
            and_(
                WalletTransaction.user_id == current_user.id,
                WalletTransaction.amount > 0
            )
        )
    ) or 0.0
    
    # Calculate total withdrawn (approved withdrawals)
    total_withdrawn = db.scalar(
        select(func.coalesce(func.sum(Withdrawal.amount), 0))
        .where(
            and_(
                Withdrawal.user_id == current_user.id,
                Withdrawal.status == "approved"
            )
        )
    ) or 0.0
    
    return {
        "success": True,
        "data": {
            "balance": float(current_user.wallet_balance),
            "pending_cashback": float(current_user.pending_cashback or 0),
            "lifetime_earnings": float(lifetime_earnings),
            "total_withdrawn": float(total_withdrawn),
        }
    }


@router.get("/transactions", response_model=dict)
def list_wallet_transactions(
    filters: WalletTransactionFilters = Depends(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get paginated wallet transaction history"""
    
    query = select(WalletTransaction).where(
        WalletTransaction.user_id == current_user.id
    )
    
    # Apply filters
    if filters.type:
        query = query.where(WalletTransaction.type == filters.type)
    
    if filters.from_date:
        try:
            from_dt = datetime.fromisoformat(filters.from_date.replace('Z', '+00:00'))
            query = query.where(WalletTransaction.created_at >= from_dt)
        except ValueError:
            pass
    
    if filters.to_date:
        try:
            to_dt = datetime.fromisoformat(filters.to_date.replace('Z', '+00:00'))
            query = query.where(WalletTransaction.created_at <= to_dt)
        except ValueError:
            pass
    
    # Get total count
    total_count = db.scalar(
        select(func.count()).select_from(query.subquery())
    )
    
    # Apply pagination and ordering
    query = query.order_by(desc(WalletTransaction.created_at))
    query = query.offset((filters.page - 1) * filters.limit).limit(filters.limit)
    
    transactions = db.scalars(query).all()
    
    return {
        "success": True,
        "data": {
            "transactions": [
                WalletTransactionRead.model_validate(txn) for txn in transactions
            ],
            "pagination": {
                "current_page": filters.page,
                "total_pages": (total_count + filters.limit - 1) // filters.limit,
                "total_items": total_count,
                "per_page": filters.limit,
            }
        }
    }


@router.post("/convert-cashback", response_model=dict)
def convert_cashback_to_wallet(
    request: CashbackConversionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Convert pending cashback to wallet balance"""
    
    # Acquire lock for this user's wallet
    lock_key = f"wallet:{current_user.id}"
    if not acquire_lock(lock_key, timeout=10):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another transaction is in progress. Please try again."
        )
    
    try:
        # Refresh user to get latest balance
        db.refresh(current_user)
        
        pending_cashback = float(current_user.pending_cashback or 0)
        
        if pending_cashback <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending cashback to convert"
            )
        
        # Determine amount to convert
        amount_to_convert = request.amount if request.amount else pending_cashback
        
        if amount_to_convert > pending_cashback:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient pending cashback. Available: ₹{pending_cashback}"
            )
        
        # Update balances (Decimal arithmetic to avoid type errors)
        amount_dec = Decimal(str(amount_to_convert))
        current_user.pending_cashback = Decimal(current_user.pending_cashback) - amount_dec
        current_user.wallet_balance = Decimal(current_user.wallet_balance) + amount_dec
        new_balance = float(current_user.wallet_balance)
        
        # Create transaction record
        transaction = WalletTransaction(
            user_id=current_user.id,
            amount=amount_to_convert,
            type="cashback_converted",
            description=f"Converted ₹{amount_to_convert:.2f} from pending cashback to wallet",
            balance_after=new_balance
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        # Queue cashback notification
        if settings.EMAIL_ENABLED:
            push_email_job(
                "cashback_confirmed",
                current_user.email,
                {
                    "user_name": current_user.name or current_user.email.split('@')[0],
                    "amount": amount_to_convert,
                    "new_balance": new_balance
                }
            )
        
        return {
            "success": True,
            "message": f"Successfully converted ₹{amount_to_convert:.2f} to wallet",
            "data": {
                "converted_amount": amount_to_convert,
                "new_balance": new_balance,
                "remaining_pending": float(current_user.pending_cashback)
            }
        }
    
    finally:
        release_lock(lock_key)


@router.post("/withdraw", response_model=dict)
def request_withdrawal(
    request: WithdrawalRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request a withdrawal from wallet balance"""
    
    # Acquire lock for this user's wallet
    lock_key = f"wallet:{current_user.id}"
    if not acquire_lock(lock_key, timeout=10):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another transaction is in progress. Please try again."
        )
    
    try:
        # Refresh user to get latest balance
        db.refresh(current_user)
        
        current_balance = float(current_user.wallet_balance)
        
        # Validate sufficient balance
        if current_balance < request.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient balance. Available: ₹{current_balance:.2f}"
            )
        
        # Check for pending withdrawals
        pending_count = db.scalar(
            select(func.count())
            .select_from(Withdrawal)
            .where(
                and_(
                    Withdrawal.user_id == current_user.id,
                    Withdrawal.status == "pending"
                )
            )
        )
        
        if pending_count >= 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have too many pending withdrawal requests. Please wait for them to be processed."
            )
        
        # Validate payment details based on method
        if request.method == "upi" and not request.upi_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="UPI ID is required for UPI withdrawals"
            )
        
        if request.method == "bank_transfer":
            if not all([request.bank_account_number, request.bank_ifsc, request.bank_account_name]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bank account details are required for bank transfers"
                )
        
        # Deduct from wallet (hold the amount) using Decimal math
        current_user.wallet_balance = Decimal(current_user.wallet_balance) - Decimal(str(request.amount))
        new_balance = float(current_user.wallet_balance)
        
        # Create withdrawal record
        withdrawal = Withdrawal(
            user_id=current_user.id,
            amount=request.amount,
            method=request.method,
            status="pending",
            upi_id=request.upi_id,
            bank_account_number=request.bank_account_number,
            bank_ifsc=request.bank_ifsc,
            bank_account_name=request.bank_account_name
        )
        db.add(withdrawal)
        
        # Create transaction record
        transaction = WalletTransaction(
            user_id=current_user.id,
            amount=-request.amount,
            type="withdrawal",
            reference=f"withdrawal_pending_{withdrawal.id}",
            description=f"Withdrawal request - {request.method}",
            balance_after=new_balance
        )
        db.add(transaction)
        
        db.commit()
        db.refresh(withdrawal)
        
        # Queue email notification
        if settings.EMAIL_ENABLED:
            push_email_job(
                "withdrawal_requested",
                current_user.email,
                {
                    "user_name": current_user.name or current_user.email.split('@')[0],
                    "amount": request.amount,
                    "method": request.method,
                    "withdrawal_id": withdrawal.id,
                    "status": "pending"
                }
            )
        
        # Queue SMS notification
        if settings.SMS_ENABLED and current_user.mobile:
            push_sms_job(
                "withdrawal_requested",
                current_user.mobile,
                {
                    "amount": request.amount,
                    "method": request.method
                }
            )
        
        return {
            "success": True,
            "message": f"Withdrawal request for ₹{request.amount:.2f} submitted successfully",
            "data": {
                "withdrawal_id": withdrawal.id,
                "amount": request.amount,
                "method": request.method,
                "status": "pending",
                "new_balance": new_balance
            }
        }
    
    finally:
        release_lock(lock_key)


@router.get("/withdrawals", response_model=dict)
def list_withdrawals(
    status_filter: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's withdrawal history"""
    
    query = select(Withdrawal).where(Withdrawal.user_id == current_user.id)
    
    if status_filter:
        query = query.where(Withdrawal.status == status_filter)
    
    # Get total count
    total_count = db.scalar(
        select(func.count()).select_from(query.subquery())
    )
    
    # Apply pagination and ordering
    query = query.order_by(desc(Withdrawal.created_at))
    query = query.offset((page - 1) * limit).limit(limit)
    
    withdrawals = db.scalars(query).all()
    
    return {
        "success": True,
        "data": {
            "withdrawals": [
                WithdrawalRead.model_validate(w) for w in withdrawals
            ],
            "pagination": {
                "current_page": page,
                "total_pages": (total_count + limit - 1) // limit,
                "total_items": total_count,
                "per_page": limit,
            }
        }
    }
