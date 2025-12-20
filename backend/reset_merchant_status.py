"""
Reset merchant application status for a user
Usage: python reset_merchant_status.py <user_id>
"""
import sys
from app.database import SessionLocal
from app.models import Merchant, User, MerchantVerificationStatus

def reset_merchant_status(user_id: int):
    db = SessionLocal()
    try:
        # Get user
        user = db.get(User, user_id)
        if not user:
            print(f"❌ User {user_id} not found")
            return
        
        print(f"📋 Current Status:")
        print(f"   User ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   merchant_verification_status: {user.merchant_verification_status}")
        print(f"   merchant_verified: {user.merchant_verified}")
        print(f"   merchant_id: {user.merchant_id}")
        
        # Find pending merchant applications
        from sqlalchemy import select
        merchants = db.scalars(
            select(Merchant).where(
                Merchant.user_id == user_id,
                Merchant.verification_status == "pending"
            )
        ).all()
        
        print(f"\n📦 Found {len(merchants)} pending merchant application(s)")
        
        if merchants:
            print("\n⚠️  Deleting pending applications...")
            for m in merchants:
                print(f"   - Deleting merchant ID {m.id} ({m.business_name})")
                db.delete(m)
        
        # Reset user status
        print("\n🔄 Resetting user status...")
        user.merchant_verification_status = MerchantVerificationStatus.NOT_APPLIED.value
        user.merchant_verified = False
        user.is_merchant = False
        user.merchant_id = None
        
        db.commit()
        print("\n✅ Status reset successfully!")
        print(f"   User can now apply as merchant again")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python reset_merchant_status.py <user_id>")
        sys.exit(1)
    
    user_id = int(sys.argv[1])
    reset_merchant_status(user_id)
