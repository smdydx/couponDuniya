from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])

class ProfileUpdate(BaseModel):
    full_name: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    avatar_url: str | None = None

class KYCRequest(BaseModel):
    account_holder_name: str
    account_number: str
    ifsc_code: str
    bank_name: str
    upi_id: str | None = None
    pan_number: str
    address_line1: str
    city: str
    state: str
    pincode: str


def _mock_user():
    return {
        "id": 123,
        "email": "user@example.com",
        "mobile": "+919876543210",
        "full_name": "John Doe",
        "avatar_url": "https://cdn.example.com/avatar.jpg",
        "wallet_balance": 1250.50,
        "pending_cashback": 340.00,
        "lifetime_earnings": 5600.75,
        "referral_code": "USER123",
        "is_verified": True,
        "created_at": datetime(2025, 1, 15, 10, 30).isoformat() + "Z",
    }


@router.get("/me", response_model=dict)
def get_me():
    return {"success": True, "data": _mock_user()}


@router.patch("/me", response_model=dict)
def update_me(payload: ProfileUpdate):
    updated = _mock_user()
    updated.update({k: v for k, v in payload.model_dump().items() if v is not None})
    return {"success": True, "data": updated}


@router.get("/me/kyc", response_model=dict)
def get_kyc():
    return {
        "success": True,
        "data": {
            "account_holder_name": "John Doe",
            "account_number": "1234567890",
            "ifsc_code": "SBIN0001234",
            "bank_name": "State Bank of India",
            "upi_id": "john@paytm",
            "pan_number": "ABCDE1234F",
            "address_line1": "123 Main St",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
        },
    }


@router.post("/me/kyc", response_model=dict)
def submit_kyc(payload: KYCRequest):
    return {"success": True, "message": "KYC submitted successfully", "data": payload.model_dump()}
