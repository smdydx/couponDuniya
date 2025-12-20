#!/usr/bin/env python3
"""
Script to check all merchant applications in the database
"""
import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import Merchant, User
from sqlalchemy import select

def main():
    db = SessionLocal()
    try:
        # Get all merchants with pending status
        pending_merchants = db.scalars(
            select(Merchant).where(Merchant.verification_status == "pending")
            .order_by(Merchant.created_at.desc())
        ).all()
        
        print(f"\n{'='*80}")
        print(f"PENDING MERCHANT APPLICATIONS: {len(pending_merchants)}")
        print(f"{'='*80}\n")
        
        for m in pending_merchants:
            user = db.get(User, m.user_id) if m.user_id else None
            print(f"Merchant ID: {m.id}")
            print(f"Business Name: {m.business_name}")
            print(f"Business Email: {m.business_email}")
            print(f"Business Phone: {m.business_phone}")
            print(f"Status: {m.status}")
            print(f"Verification Status: {m.verification_status}")
            print(f"User ID: {m.user_id}")
            if user:
                print(f"User Email: {user.email}")
                print(f"User Phone: {user.phone}")
            print(f"Created At: {m.created_at}")
            print(f"{'-'*80}\n")
        
        # Get all merchants (any status)
        all_merchants = db.scalars(select(Merchant).order_by(Merchant.created_at.desc())).all()
        print(f"\n{'='*80}")
        print(f"ALL MERCHANTS: {len(all_merchants)}")
        print(f"{'='*80}\n")
        
        for m in all_merchants:
            user = db.get(User, m.user_id) if m.user_id else None
            print(f"ID: {m.id} | Business: {m.business_name} | Status: {m.status} | Verification: {m.verification_status} | User: {user.email if user else 'N/A'}")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
