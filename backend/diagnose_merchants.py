#!/usr/bin/env python3
"""
Complete diagnostic script for merchant applications
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import Merchant, User
from sqlalchemy import select
from datetime import datetime

def main():
    db = SessionLocal()
    try:
        print("\n" + "="*100)
        print("COMPLETE MERCHANT APPLICATION DIAGNOSTIC")
        print("="*100 + "\n")
        
        # Get all users
        all_users = db.scalars(select(User).order_by(User.created_at.desc())).all()
        print(f"Total Users in Database: {len(all_users)}\n")
        
        # Get all merchants
        all_merchants = db.scalars(select(Merchant).order_by(Merchant.created_at.desc())).all()
        print(f"Total Merchants in Database: {len(all_merchants)}\n")
        
        # Get pending merchants
        pending_merchants = db.scalars(
            select(Merchant).where(Merchant.verification_status == "pending")
            .order_by(Merchant.created_at.desc())
        ).all()
        print(f"Pending Merchant Applications: {len(pending_merchants)}\n")
        
        # Get approved merchants
        approved_merchants = db.scalars(
            select(Merchant).where(Merchant.verification_status == "approved")
            .order_by(Merchant.created_at.desc())
        ).all()
        print(f"Approved Merchants: {len(approved_merchants)}\n")
        
        # Get rejected merchants
        rejected_merchants = db.scalars(
            select(Merchant).where(Merchant.verification_status == "rejected")
            .order_by(Merchant.created_at.desc())
        ).all()
        print(f"Rejected Merchants: {len(rejected_merchants)}\n")
        
        print("="*100)
        print("DETAILED MERCHANT LIST")
        print("="*100 + "\n")
        
        for m in all_merchants:
            user = db.get(User, m.user_id) if m.user_id else None
            print(f"Merchant ID: {m.id}")
            print(f"  Business Name: {m.business_name or 'N/A'}")
            print(f"  Business Email: {m.business_email or 'N/A'}")
            print(f"  Business Phone: {m.business_phone or 'N/A'}")
            print(f"  Status: {m.status}")
            print(f"  Verification Status: {m.verification_status}")
            print(f"  Is Active: {m.is_active}")
            print(f"  Is Verified: {m.is_verified}")
            print(f"  User ID: {m.user_id}")
            if user:
                print(f"  User Email: {user.email}")
                print(f"  User Phone: {user.mobile or 'N/A'}")
                print(f"  User Merchant Status: {user.merchant_verification_status}")
            print(f"  Created At: {m.created_at}")
            print(f"  Updated At: {m.updated_at}")
            print(f"{'-'*100}\n")
        
        print("="*100)
        print("USERS WITH MERCHANT APPLICATIONS")
        print("="*100 + "\n")
        
        for user in all_users:
            if user.merchant_verification_status != "not_applied" or user.is_merchant or user.merchant_id:
                print(f"User ID: {user.id}")
                print(f"  Email: {user.email}")
                print(f"  Phone: {user.mobile or 'N/A'}")
                print(f"  Full Name: {user.full_name or 'N/A'}")
                print(f"  Is Merchant: {user.is_merchant}")
                print(f"  Merchant Verified: {user.merchant_verified}")
                print(f"  Merchant Verification Status: {user.merchant_verification_status}")
                print(f"  Merchant ID: {user.merchant_id}")
                print(f"  Role: {user.role}")
                print(f"  Created At: {user.created_at}")
                
                # Check if merchant record exists
                if user.merchant_id:
                    merchant = db.get(Merchant, user.merchant_id)
                    if merchant:
                        print(f"  ✓ Merchant Record Exists: {merchant.business_name}")
                    else:
                        print(f"  ✗ WARNING: Merchant ID {user.merchant_id} not found in database!")
                
                print(f"{'-'*100}\n")
        
        print("\n" + "="*100)
        print("SUMMARY")
        print("="*100)
        print(f"Total Users: {len(all_users)}")
        print(f"Total Merchants: {len(all_merchants)}")
        print(f"Pending Applications: {len(pending_merchants)}")
        print(f"Approved Merchants: {len(approved_merchants)}")
        print(f"Rejected Applications: {len(rejected_merchants)}")
        print("="*100 + "\n")
        
        # Check for orphaned records
        print("CHECKING FOR DATA INTEGRITY ISSUES...")
        orphaned_users = []
        for user in all_users:
            if user.merchant_id:
                merchant = db.get(Merchant, user.merchant_id)
                if not merchant:
                    orphaned_users.append(user)
        
        if orphaned_users:
            print(f"\n⚠️  WARNING: Found {len(orphaned_users)} users with invalid merchant_id:")
            for user in orphaned_users:
                print(f"  - User {user.id} ({user.email}) has merchant_id={user.merchant_id} but merchant doesn't exist")
        else:
            print("\n✓ No orphaned user records found")
        
        orphaned_merchants = []
        for merchant in all_merchants:
            if merchant.user_id:
                user = db.get(User, merchant.user_id)
                if not user:
                    orphaned_merchants.append(merchant)
        
        if orphaned_merchants:
            print(f"\n⚠️  WARNING: Found {len(orphaned_merchants)} merchants with invalid user_id:")
            for merchant in orphaned_merchants:
                print(f"  - Merchant {merchant.id} ({merchant.business_name}) has user_id={merchant.user_id} but user doesn't exist")
        else:
            print("\n✓ No orphaned merchant records found")
        
        print("\n" + "="*100 + "\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
