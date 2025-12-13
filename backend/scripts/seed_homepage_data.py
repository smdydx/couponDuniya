"""
Professional seed script to populate homepage with sample data
Run: python -m backend.scripts.seed_homepage_data
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Merchant, Offer, Product, ProductVariant, Banner, Category
from datetime import datetime, timedelta
import random

def seed_database():
    """Seed database with professional sample data"""
    print("🌱 Starting database seeding...")

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Clear existing data
        print("🧹 Cleaning existing data...")
        db.query(ProductVariant).delete()
        db.query(Product).delete()
        db.query(Offer).delete()
        db.query(Merchant).delete()
        db.query(Banner).delete()
        db.query(Category).delete()
        db.commit()

        # Create Categories
        print("📁 Creating categories...")
        categories = [
            Category(name="Fashion", slug="fashion", icon_url="/images/icons/10001.svg", is_active=True),
            Category(name="Electronics", slug="electronics", icon_url="/images/icons/10002.svg", is_active=True),
            Category(name="Food & Dining", slug="food-dining", icon_url="/images/icons/10003.svg", is_active=True),
            Category(name="Travel", slug="travel", icon_url="/images/icons/10004.svg", is_active=True),
            Category(name="Entertainment", slug="entertainment", icon_url="/images/icons/10005.svg", is_active=True),
        ]
        db.add_all(categories)
        db.commit()

        # Create Merchants
        print("🏪 Creating merchants...")
        merchants_data = [
            {"name": "Amazon", "slug": "amazon", "logo_url": "/images/merchants/amazon.png", "is_featured": True},
            {"name": "Flipkart", "slug": "flipkart", "logo_url": "/images/merchants/flipkart.png", "is_featured": True},
            {"name": "Myntra", "slug": "myntra", "logo_url": "/images/merchants/myntra.png", "is_featured": True},
            {"name": "Ajio", "slug": "ajio", "logo_url": "/images/merchants/ajio.png", "is_featured": True},
            {"name": "Swiggy", "slug": "swiggy", "logo_url": "/images/merchants/swiggy.png", "is_featured": True},
            {"name": "BookMyShow", "slug": "bookmyshow", "logo_url": "/images/merchants/bookmyshow.png", "is_featured": True},
            {"name": "Uber", "slug": "uber", "logo_url": "/images/merchants/uber.png", "is_featured": False},
            {"name": "Starbucks", "slug": "starbucks", "logo_url": "/images/merchants/starbucks.png", "is_featured": False},
        ]

        merchants = []
        for m in merchants_data:
            merchant = Merchant(
                name=m["name"],
                slug=m["slug"],
                logo_url=m["logo_url"],
                description=f"Get best deals and cashback on {m['name']}",
                is_active=True,
                is_featured=m["is_featured"]
            )
            merchants.append(merchant)

        db.add_all(merchants)
        db.commit()

        # Create Offers
        print("🎁 Creating offers...")
        offers = []
        for merchant in merchants[:6]:  # Create offers for first 6 merchants
            # Featured offer
            offers.append(Offer(
                merchant_id=merchant.id,
                title=f"Flat 50% OFF on {merchant.name}",
                code=f"{merchant.slug.upper()}50",
                image_url=f"/images/offers/{random.randint(1, 50)}.png",
                is_active=True,
                is_featured=True,
                is_exclusive=False,
                priority=random.randint(5, 10),
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=30)
            ))

            # Exclusive offer
            offers.append(Offer(
                merchant_id=merchant.id,
                title=f"Exclusive: Extra 20% Cashback on {merchant.name}",
                code=f"{merchant.slug.upper()}CB20",
                image_url=f"/images/offers/{random.randint(1, 50)}.png",
                is_active=True,
                is_featured=False,
                is_exclusive=True,
                priority=random.randint(7, 10),
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=15)
            ))

        db.add_all(offers)
        db.commit()

        # Create Products (Gift Cards)
        print("💳 Creating gift cards...")
        products = []
        for merchant in merchants[:8]:
            product = Product(
                merchant_id=merchant.id,
                name=f"{merchant.name} Gift Card",
                slug=f"{merchant.slug}-gift-card",
                description=f"Buy {merchant.name} gift cards at discounted prices. Instant delivery!",
                image_url=f"/images/gift-cards/{merchant.slug}.png",
                price=500.00,
                stock=1000,
                category_id=categories[random.randint(0, len(categories)-1)].id,
                is_bestseller=random.choice([True, False]),
                is_featured=merchant.is_featured,
                is_active=True
            )
            products.append(product)

        db.add_all(products)
        db.commit()

        # Create Product Variants
        print("📦 Creating product variants...")
        variants = []
        denominations = [100, 250, 500, 1000, 2000, 5000]
        for product in products:
            for denom in denominations:
                discount = random.randint(3, 8)
                selling_price = denom * (1 - discount/100)
                variants.append(ProductVariant(
                    product_id=product.id,
                    sku=f"{product.slug}-{denom}",
                    name=f"₹{denom}",
                    price=selling_price,
                    stock=random.randint(50, 200),
                    is_available=True
                ))

        db.add_all(variants)
        db.commit()

        # Create Banners
        print("🎨 Creating banners...")
        hero_banners = [
            Banner(
                title="Welcome to BIDUA Coupons",
                banner_type="hero",
                image_url="/images/banners/10016.jpg",
                link_url="/",
                is_active=True,
                order_index=1
            ),
            Banner(
                title="Mega Sale - Up to 70% OFF",
                banner_type="hero",
                image_url="/images/banners/10017.jpg",
                link_url="/coupons",
                is_active=True,
                order_index=2
            ),
        ]

        promo_banners = [
            Banner(
                title="Amazon Mega Sale",
                banner_type="promo",
                brand_name="Amazon",
                badge_text="HOT",
                badge_color="#FF6B6B",
                headline="Flat 50% OFF",
                description="On all electronics",
                code="AMAZON50",
                link_url="/merchants/amazon",
                style_metadata='{"gradient": "from-orange-500 to-red-600", "emoji": "🔥"}',
                is_active=True,
                order_index=1
            ),
            Banner(
                title="Flipkart Flash Sale",
                banner_type="promo",
                brand_name="Flipkart",
                badge_text="NEW",
                badge_color="#4CAF50",
                headline="Extra 30% Cashback",
                description="On fashion items",
                code="FLIP30",
                link_url="/merchants/flipkart",
                style_metadata='{"gradient": "from-blue-500 to-purple-600", "emoji": "⚡"}',
                is_active=True,
                order_index=2
            ),
        ]

        db.add_all(hero_banners + promo_banners)
        db.commit()

        print("✅ Database seeded successfully!")
        print(f"   - {len(categories)} categories")
        print(f"   - {len(merchants)} merchants")
        print(f"   - {len(offers)} offers")
        print(f"   - {len(products)} products")
        print(f"   - {len(variants)} product variants")
        print(f"   - {len(hero_banners) + len(promo_banners)} banners")
        print("\n🎉 Your homepage should now be populated with data!")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()