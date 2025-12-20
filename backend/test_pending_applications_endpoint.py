#!/usr/bin/env python3
"""
Script to directly test the get_pending_merchant_applications endpoint logic
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import Merchant, User, MerchantStatus
from sqlalchemy import select, func
from math import ceil

def test_get_pending_applications():
    db = SessionLocal()
    try:
        # Simulate the endpoint logic
        page = 1
        limit = 20
        status = "pending"
        
        query = select(Merchant).where(Merchant.verification_status == status)
        
        total = db.scalar(select(func.count()).select_from(query.subquery()))
        offset = (page - 1) * limit
        merchants = db.scalars(query.order_by(Merchant.created_at.desc()).offset(offset).limit(limit)).all()
        
        applications = []
        for m in merchants:
            user = db.get(User, m.user_id) if m.user_id else None
            applications.append({
                "id": m.id,
                "merchant": m.to_dict(),
                "business_name": m.business_name,
                "business_email": m.business_email,
                "business_phone": m.business_phone,
                "business_address": m.business_address,
                "business_city": m.business_city,
                "business_state": m.business_state,
                "business_pincode": m.business_pincode,
                "gst_number": m.gst_number,
                "pan_number": m.pan_number,
                "website_url": m.website_url,
                "user": user.to_dict() if user else None,
                "created_at": m.created_at.isoformat() if m.created_at else None
            })
        
        response = {
            "success": True,
            "data": {
                "applications": applications,
                "pagination": {
                    "current_page": page,
                    "total_pages": ceil(total / limit) if total else 0,
                    "total_items": total,
                    "per_page": limit
                }
            }
        }
        
        print("\n" + "="*80)
        print("GET PENDING MERCHANT APPLICATIONS - ENDPOINT SIMULATION")
        print("="*80 + "\n")
        print(f"Total pending applications: {total}")
        print(f"Applications returned: {len(applications)}\n")
        
        for app in applications:
            print(f"ID: {app['id']}")
            print(f"Business: {app['business_name']}")
            print(f"Email: {app['business_email']}")
            print(f"User: {app['user']['email'] if app['user'] else 'N/A'}")
            print(f"Created: {app['created_at']}")
            print("-" * 80)
        
        return response
        
    finally:
        db.close()

if __name__ == "__main__":
    result = test_get_pending_applications()
