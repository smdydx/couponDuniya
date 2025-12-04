
"""Seed script for homepage data - merchants, offers, and products"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models import Merchant, Offer, Product, ProductVariant, Category
from sqlalchemy import select
from datetime import datetime, timedelta

def seed_homepage_data():
    db = SessionLocal()
    
    try:
        print("🌱 Seeding homepage data...")
        
        # Create categories first
        categories_data = [
            {"name": "Fashion", "slug": "fashion"},
            {"name": "Electronics", "slug": "electronics"},
            {"name": "Food & Dining", "slug": "food-dining"},
            {"name": "Travel", "slug": "travel"},
        ]
        
        for cat_data in categories_data:
            existing = db.scalar(select(Category).where(Category.slug == cat_data["slug"]))
            if not existing:
                category = Category(**cat_data, is_active=True)
                db.add(category)
        
        db.commit()
        print("✅ Categories created")
        
        # Get category IDs
        fashion_cat = db.scalar(select(Category).where(Category.slug == "fashion"))
        electronics_cat = db.scalar(select(Category).where(Category.slug == "electronics"))
        food_cat = db.scalar(select(Category).where(Category.slug == "food-dining"))
        
        # Create merchants
        merchants_data = [
            {
                "name": "Amazon",
                "slug": "amazon",
                "logo_url": "/images/merchants/amazon.png",
                "description": "India's largest online marketplace",
                "is_featured": True,
                "is_active": True
            },
            {
                "name": "Flipkart",
                "slug": "flipkart",
                "logo_url": "/images/merchants/flipkart.png",
                "description": "Shop electronics, fashion & more",
                "is_featured": True,
                "is_active": True
            },
            {
                "name": "Myntra",
                "slug": "myntra",
                "logo_url": "/images/merchants/myntra.png",
                "description": "Fashion & lifestyle destination",
                "is_featured": True,
                "is_active": True
            },
            {
                "name": "Swiggy",
                "slug": "swiggy",
                "logo_url": "/images/merchants/swiggy.png",
                "description": "Food delivery & dining",
                "is_featured": True,
                "is_active": True
            },
            {
                "name": "BookMyShow",
                "slug": "bookmyshow",
                "logo_url": "/images/merchants/bookmyshow.png",
                "description": "Movie tickets & events",
                "is_featured": True,
                "is_active": True
            },
            {
                "name": "Uber",
                "slug": "uber",
                "logo_url": "/images/merchants/uber.png",
                "description": "Ride sharing service",
                "is_featured": True,
                "is_active": True
            },
        ]
        
        merchant_objects = {}
        for merchant_data in merchants_data:
            existing = db.scalar(select(Merchant).where(Merchant.slug == merchant_data["slug"]))
            if not existing:
                merchant = Merchant(**merchant_data)
                db.add(merchant)
                db.flush()
                merchant_objects[merchant_data["slug"]] = merchant
            else:
                merchant_objects[merchant_data["slug"]] = existing
        
        db.commit()
        print(f"✅ Created {len(merchants_data)} merchants")
        
        # Create offers
        offers_data = [
            {
                "merchant": "amazon",
                "title": "Flat 20% Off on Electronics",
                "code": "ELEC20",
                "image_url": "/images/offers/amazon.jpg",
                "is_featured": True,
                "is_exclusive": False,
                "priority": 10,
                "is_active": True,
            },
            {
                "merchant": "flipkart",
                "title": "Get 30% Cashback on Fashion",
                "code": "FASHION30",
                "image_url": "/images/offers/flipkart.png",
                "is_featured": True,
                "is_exclusive": True,
                "priority": 9,
                "is_active": True,
            },
            {
                "merchant": "myntra",
                "title": "Buy 2 Get 1 Free",
                "code": "BUY2GET1",
                "image_url": "/images/offers/myntra.png",
                "is_featured": True,
                "is_exclusive": False,
                "priority": 8,
                "is_active": True,
            },
            {
                "merchant": "swiggy",
                "title": "Free Delivery on First Order",
                "code": "FIRST50",
                "image_url": "/images/offers/swiggy.png",
                "is_featured": True,
                "is_exclusive": True,
                "priority": 7,
                "is_active": True,
            },
            {
                "merchant": "bookmyshow",
                "title": "₹150 Off on Movie Tickets",
                "code": "MOVIE150",
                "image_url": "/images/offers/bookmyshow.png",
                "is_featured": True,
                "is_exclusive": False,
                "priority": 6,
                "is_active": True,
            },
            {
                "merchant": "uber",
                "title": "50% Off on First Ride",
                "code": "RIDE50",
                "image_url": "/images/offers/uber.png",
                "is_featured": True,
                "is_exclusive": True,
                "priority": 5,
                "is_active": True,
            },
        ]
        
        for offer_data in offers_data:
            merchant_slug = offer_data.pop("merchant")
            merchant = merchant_objects.get(merchant_slug)
            if merchant:
                existing = db.scalar(
                    select(Offer).where(
                        Offer.merchant_id == merchant.id,
                        Offer.code == offer_data["code"]
                    )
                )
                if not existing:
                    offer = Offer(
                        **offer_data,
                        merchant_id=merchant.id,
                        start_date=datetime.utcnow(),
                        end_date=datetime.utcnow() + timedelta(days=30)
                    )
                    db.add(offer)
        
        db.commit()
        print(f"✅ Created {len(offers_data)} offers")
        
        # Create products (gift cards)
        products_data = [
            {
                "merchant": "amazon",
                "name": "Amazon Gift Card",
                "slug": "amazon-gift-card",
                "description": "Shop anything on Amazon",
                "image_url": "/images/gift-cards/amazon.jpg",
                "price": 500,
                "stock": 100,
                "category": electronics_cat,
                "is_featured": True,
                "is_bestseller": True,
            },
            {
                "merchant": "flipkart",
                "name": "Flipkart Gift Voucher",
                "slug": "flipkart-gift-voucher",
                "description": "Perfect for all shopping needs",
                "image_url": "/images/gift-cards/flipkart.png",
                "price": 500,
                "stock": 100,
                "category": electronics_cat,
                "is_featured": True,
                "is_bestseller": False,
            },
            {
                "merchant": "myntra",
                "name": "Myntra Fashion Card",
                "slug": "myntra-fashion-card",
                "description": "Latest fashion trends",
                "image_url": "/images/gift-cards/myntra.png",
                "price": 1000,
                "stock": 50,
                "category": fashion_cat,
                "is_featured": True,
                "is_bestseller": True,
            },
            {
                "merchant": "swiggy",
                "name": "Swiggy Food Card",
                "slug": "swiggy-food-card",
                "description": "Order your favorite meals",
                "image_url": "/images/gift-cards/swiggy.png",
                "price": 500,
                "stock": 75,
                "category": food_cat,
                "is_featured": True,
                "is_bestseller": False,
            },
        ]
        
        for product_data in products_data:
            merchant_slug = product_data.pop("merchant")
            category = product_data.pop("category")
            merchant = merchant_objects.get(merchant_slug)
            
            if merchant:
                existing = db.scalar(select(Product).where(Product.slug == product_data["slug"]))
                if not existing:
                    product = Product(
                        **product_data,
                        merchant_id=merchant.id,
                        category_id=category.id if category else None,
                        is_active=True
                    )
                    db.add(product)
                    db.flush()
                    
                    # Add variants
                    denominations = [500, 1000, 2000]
                    for denom in denominations:
                        variant = ProductVariant(
                            product_id=product.id,
                            sku=f"{product.slug}-{denom}",
                            name=f"₹{denom} Card",
                            price=denom,
                            stock=50,
                            is_available=True
                        )
                        db.add(variant)
        
        db.commit()
        print(f"✅ Created {len(products_data)} products with variants")
        
        print("\n🎉 Homepage data seeding completed successfully!")
        print("\nYou should now see:")
        print("- Featured merchants on homepage")
        print("- Featured offers")
        print("- Exclusive offers")
        print("- Featured products (gift cards)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_homepage_data()
