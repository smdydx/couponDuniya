#!/usr/bin/env python3
"""
Script to check users with merchant application status
"""
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import User
from sqlalchemy import select

def main():
    db = SessionLocal()
    try:
        # Get all users
        all_users = db.scalars(select(User).order_by(User.created_at.desc())).all()
        
        print(f"\n{'='*80}")
        print(f"ALL USERS WITH MERCHANT STATUS")
        print(f"{'='*80}\n")
        
        for user in all_users:
            if user.merchant_verification_status != "not_applied" or user.is_merchant or user.merchant_id:
                print(f"User ID: {user.id}")
                print(f"Email: {user.email}")
                print(f"Phone: {user.mobile}")
                print(f"Is Merchant: {user.is_merchant}")
                print(f"Merchant Verified: {user.merchant_verified}")
                print(f"Merchant Verification Status: {user.merchant_verification_status}")
                print(f"Merchant ID: {user.merchant_id}")
                print(f"Role: {user.role}")
                print(f"Created At: {user.created_at}")
                print(f"{'-'*80}\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
