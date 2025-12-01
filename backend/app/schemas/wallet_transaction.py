from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

class WalletTransactionBase(BaseModel):
    amount: float = Field(..., description="Transaction amount (positive for credit, negative for debit)")
    type: str = Field(..., description="Transaction type: cashback_earned, cashback_converted, order_payment, withdrawal, refund, admin_adjustment")
    reference: Optional[str] = Field(None, description="Reference ID (order_id, withdrawal_id, etc.)")
    description: Optional[str] = Field(None, description="Human-readable description")

class WalletTransactionCreate(WalletTransactionBase):
    user_id: int
    balance_after: float = Field(..., description="Balance after this transaction")

class WalletTransactionRead(WalletTransactionBase):
    id: int
    user_id: int
    balance_after: float
    created_at: datetime

    class Config:
        from_attributes = True

class WalletTransactionFilters(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    type: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None

class WalletSummary(BaseModel):
    balance: float
    pending_cashback: float
    lifetime_earnings: float
    total_withdrawn: float

class WithdrawalRequestCreate(BaseModel):
    amount: float = Field(..., gt=0, description="Withdrawal amount")
    method: str = Field(..., description="Withdrawal method: bank_transfer, upi, paytm")
    upi_id: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_name: Optional[str] = None

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v < 100:
            raise ValueError('Minimum withdrawal amount is ₹100')
        if v > 50000:
            raise ValueError('Maximum withdrawal amount is ₹50,000 per request')
        return v

    @field_validator('method')
    @classmethod
    def validate_method(cls, v):
        valid_methods = ['bank_transfer', 'upi', 'paytm']
        if v not in valid_methods:
            raise ValueError(f'Invalid method. Must be one of: {", ".join(valid_methods)}')
        return v

class WithdrawalRead(BaseModel):
    id: int
    user_id: int
    amount: float
    method: str
    status: str
    upi_id: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_account_name: Optional[str] = None
    admin_notes: Optional[str] = None
    transaction_id: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WithdrawalStatusUpdate(BaseModel):
    status: str = Field(..., description="Status: approved, rejected")
    admin_notes: Optional[str] = None
    transaction_id: Optional[str] = Field(None, description="Bank/UPI transaction ID")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v):
        if v not in ['approved', 'rejected']:
            raise ValueError('Status must be either approved or rejected')
        return v

class CashbackConversionRequest(BaseModel):
    amount: Optional[float] = Field(None, description="Amount to convert (null for all pending cashback)")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Amount must be positive')
        return v
