"""
Seed script to populate database with initial data.
Run with: python seed.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from passlib.context import CryptContext
from app.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.category import Category
from app.models.merchant import Merchant
from app.models.offer import Offer
from app.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_admin_user(db):
    """Create admin user if not exists."""
    admin_email = "admin@couponali.com"
    existing = db.query(User).filter(User.email == admin_email).first()
    
    if existing:
        print(f"Admin user already exists: {admin_email}")
        return existing
    
    admin = User(
        email=admin_email,
        full_name="Admin User",
        password_hash=pwd_context.hash(settings.DEFAULT_PASSWORD),
        is_verified=True,
        is_admin=True,
        is_active=True,
        role="admin",
        auth_provider="email",
        email_verified_at=datetime.utcnow(),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"Created admin user: {admin_email} / {settings.DEFAULT_PASSWORD}")
    return admin


def seed_categories(db):
    """Create sample categories."""
    categories_data = [
        {"name": "Electronics", "slug": "electronics", "description": "Latest gadgets and electronics deals"},
        {"name": "Fashion", "slug": "fashion", "description": "Clothing, shoes, and accessories"},
        {"name": "Food & Dining", "slug": "food-dining", "description": "Restaurant and food delivery offers"},
        {"name": "Travel", "slug": "travel", "description": "Hotels, flights, and vacation packages"},
        {"name": "Beauty & Health", "slug": "beauty-health", "description": "Skincare, makeup, and wellness"},
        {"name": "Home & Kitchen", "slug": "home-kitchen", "description": "Furniture and home appliances"},
    ]
    
    created = 0
    for cat_data in categories_data:
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if not existing:
            category = Category(**cat_data, is_active=True)
            db.add(category)
            created += 1
    
    db.commit()
    print(f"Created {created} categories (skipped {len(categories_data) - created} existing)")


def seed_merchants(db):
    """Create sample merchants."""
    merchants_data = [
        {"name": "Amazon", "slug": "amazon", "description": "World's largest online retailer", "is_featured": True},
        {"name": "Flipkart", "slug": "flipkart", "description": "India's leading e-commerce platform", "is_featured": True},
        {"name": "Myntra", "slug": "myntra", "description": "Fashion and lifestyle shopping", "is_featured": True},
        {"name": "Swiggy", "slug": "swiggy", "description": "Food delivery and dining", "is_featured": False},
        {"name": "MakeMyTrip", "slug": "makemytrip", "description": "Travel booking platform", "is_featured": True},
        {"name": "Nykaa", "slug": "nykaa", "description": "Beauty and cosmetics", "is_featured": False},
    ]
    
    created = 0
    for merch_data in merchants_data:
        existing = db.query(Merchant).filter(Merchant.slug == merch_data["slug"]).first()
        if not existing:
            merchant = Merchant(**merch_data, is_active=True)
            db.add(merchant)
            created += 1
    
    db.commit()
    print(f"Created {created} merchants (skipped {len(merchants_data) - created} existing)")


def seed_offers(db):
    """Create sample offers."""
    merchants = db.query(Merchant).all()
    if not merchants:
        print("No merchants found, skipping offers")
        return
    
    merchant_map = {m.slug: m.id for m in merchants}
    
    offers_data = [
        {"merchant_slug": "amazon", "title": "Flat 10% Off on Electronics", "code": "ELEC10", "is_featured": True},
        {"merchant_slug": "amazon", "title": "Up to 50% Off Fashion Sale", "code": "FASHION50", "is_featured": True},
        {"merchant_slug": "flipkart", "title": "Big Billion Days Special", "code": "BBD2024", "is_featured": True},
        {"merchant_slug": "flipkart", "title": "Extra 15% Off with Axis Card", "code": None, "is_featured": False},
        {"merchant_slug": "myntra", "title": "End of Season Sale - 70% Off", "code": "EOSS70", "is_featured": True},
        {"merchant_slug": "swiggy", "title": "Free Delivery on Orders Above 199", "code": "FREEDEL", "is_featured": False},
        {"merchant_slug": "makemytrip", "title": "Flat 20% Off on Domestic Flights", "code": "FLY20", "is_featured": True},
        {"merchant_slug": "nykaa", "title": "Buy 2 Get 1 Free on Lipsticks", "code": "LIPS321", "is_featured": False},
    ]
    
    created = 0
    for offer_data in offers_data:
        merchant_id = merchant_map.get(offer_data["merchant_slug"])
        if not merchant_id:
            continue
        
        existing = db.query(Offer).filter(
            Offer.merchant_id == merchant_id,
            Offer.title == offer_data["title"]
        ).first()
        
        if not existing:
            offer = Offer(
                merchant_id=merchant_id,
                title=offer_data["title"],
                code=offer_data["code"],
                is_active=True,
                is_featured=offer_data["is_featured"],
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=30),
            )
            db.add(offer)
            created += 1
    
    db.commit()
    print(f"Created {created} offers (skipped {len(offers_data) - created} existing)")


def main():
    print("Starting database seeding...")
    
    db = SessionLocal()
    try:
        seed_admin_user(db)
        seed_categories(db)
        seed_merchants(db)
        seed_offers(db)
        print("Seeding completed successfully!")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
