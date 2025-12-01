"""
Seed script for CouponAli platform
Populates database with real merchant, offer, gift card, and user data
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models import (
    User, Merchant, Category, Offer, Product, ProductVariant,
    GiftCard, Role, Permission, RolePermission, Department
)
from app.security import get_password_hash
from datetime import datetime, timedelta
import uuid

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)

MERCHANTS_DATA = [
    {"name": "Amazon", "slug": "amazon", "description": "India's largest online marketplace"},
    {"name": "Flipkart", "slug": "flipkart", "description": "Big Billion Days and more"},
    {"name": "Myntra", "slug": "myntra", "description": "Fashion & lifestyle destination"},
    {"name": "Swiggy", "slug": "swiggy", "description": "Food delivery at your doorstep"},
    {"name": "Zomato", "slug": "zomato", "description": "Dine out or order in"},
    {"name": "BookMyShow", "slug": "bookmyshow", "description": "Movie & event bookings"},
    {"name": "MakeMyTrip", "slug": "makemytrip", "description": "Travel bookings made easy"},
    {"name": "Uber", "slug": "uber", "description": "Ride & food delivery"},
    {"name": "Ajio", "slug": "ajio", "description": "Trendy fashion & accessories"},
    {"name": "BigBasket", "slug": "bigbasket", "description": "Online grocery shopping"},
    {"name": "Nykaa", "slug": "nykaa", "description": "Beauty, wellness and personal care"},
    {"name": "Tata Cliq", "slug": "tatacliq", "description": "Premium fashion and electronics"},
    {"name": "Croma", "slug": "croma", "description": "Electronics and appliances"},
    {"name": "Pepperfry", "slug": "pepperfry", "description": "Furniture and home decor"},
    {"name": "Dominos", "slug": "dominos", "description": "Pizzas and sides delivered hot"},
    {"name": "Reliance Trends", "slug": "reliance-trends", "description": "Value fashion for everyone"},
    {"name": "FirstCry", "slug": "firstcry", "description": "Baby & kids store"},
    {"name": "PharmEasy", "slug": "pharmeasy", "description": "Medicines and diagnostics"},
]

CATEGORIES_DATA = [
    {"name": "Fashion", "slug": "fashion"},
    {"name": "Electronics", "slug": "electronics"},
    {"name": "Food & Dining", "slug": "food-dining"},
    {"name": "Travel", "slug": "travel"},
    {"name": "Entertainment", "slug": "entertainment"},
    {"name": "Groceries", "slug": "groceries"},
    {"name": "Health & Beauty", "slug": "health-beauty"},
    {"name": "Home & Living", "slug": "home-living"},
    {"name": "Baby & Kids", "slug": "baby-kids"},
    {"name": "Pharmacy", "slug": "pharmacy"},
    {"name": "Sports & Fitness", "slug": "sports-fitness"},
]

GIFT_CARDS_DATA = [
    {"name": "Amazon Pay Gift Card", "slug": "amazon-pay", "image_url": "/images/gift-cards/1.png", "min_value": 100, "max_value": 10000},
    {"name": "Flipkart Gift Card", "slug": "flipkart-gc", "image_url": "/images/gift-cards/2.png", "min_value": 100, "max_value": 10000},
    {"name": "Myntra Gift Voucher", "slug": "myntra-voucher", "image_url": "/images/gift-cards/3.png", "min_value": 500, "max_value": 5000},
    {"name": "Swiggy Money", "slug": "swiggy-money", "image_url": "/images/gift-cards/4.png", "min_value": 100, "max_value": 2000},
    {"name": "BookMyShow Voucher", "slug": "bms-voucher", "image_url": "/images/gift-cards/6.png", "min_value": 200, "max_value": 3000},
    {"name": "MakeMyTrip Gift Card", "slug": "mmt-gc", "image_url": "/images/gift-cards/7.png", "min_value": 500, "max_value": 10000},
    {"name": "Uber Gift Card", "slug": "uber-gc", "image_url": "/images/gift-cards/8.png", "min_value": 100, "max_value": 5000},
    {"name": "Zomato Gift Voucher", "slug": "zomato-voucher", "image_url": "/images/gift-cards/9.png", "min_value": 100, "max_value": 2000},
    {"name": "Ajio Gift Card", "slug": "ajio-gc", "image_url": "/images/gift-cards/10.png", "min_value": 500, "max_value": 5000},
    {"name": "BigBasket E-Gift Card", "slug": "bigbasket-egift", "image_url": "/images/gift-cards/11.png", "min_value": 200, "max_value": 5000},
    {"name": "Nykaa Luxe Card", "slug": "nykaa-luxe", "image_url": "/images/gift-cards/12.png", "min_value": 250, "max_value": 5000},
    {"name": "Tata Cliq Card", "slug": "tatacliq-card", "image_url": "/images/gift-cards/13.png", "min_value": 250, "max_value": 7500},
    {"name": "Croma Store Card", "slug": "croma-card", "image_url": "/images/gift-cards/14.png", "min_value": 500, "max_value": 15000},
    {"name": "Pepperfry Decor Pass", "slug": "pepperfry-pass", "image_url": "/images/gift-cards/15.png", "min_value": 500, "max_value": 10000},
    {"name": "Dominos Party Card", "slug": "dominos-card", "image_url": "/images/gift-cards/16.png", "min_value": 200, "max_value": 2000},
    {"name": "Reliance Trends Cash Card", "slug": "reliance-trends-card", "image_url": "/images/gift-cards/17.png", "min_value": 300, "max_value": 5000},
    {"name": "FirstCry Super Card", "slug": "firstcry-card", "image_url": "/images/gift-cards/18.png", "min_value": 250, "max_value": 5000},
    {"name": "PharmEasy Health Card", "slug": "pharmeasy-card", "image_url": "/images/gift-cards/19.png", "min_value": 200, "max_value": 3000},
]

def seed_admin_user(session: Session):
    """Create admin user"""
    admin = session.scalar(select(User).where(User.email == "admin@couponali.com"))
    if not admin:
        admin = User(
            email="admin@couponali.com",
            password_hash=get_password_hash("admin123"),
            is_active=True,
            is_admin=True,
        )
        session.add(admin)
        session.commit()
        print("✓ Admin user created (admin@couponali.com / admin123)")
    else:
        # Ensure password is set for existing admin (force set for dev)
        admin.password_hash = get_password_hash("admin123")
        session.commit()
        print("✓ Admin user password updated")
    return admin

def seed_roles_permissions(session: Session):
    """Create roles and permissions"""
    # Permissions
    permissions_data = [
        "users.read", "users.write", "merchants.read", "merchants.write",
        "offers.read", "offers.write", "orders.read", "orders.write",
        "analytics.read", "finance.read", "finance.write"
    ]
    
    for perm_code in permissions_data:
        perm = session.scalar(select(Permission).where(Permission.code == perm_code))
        if not perm:
            perm = Permission(code=perm_code, description=f"Permission for {perm_code}")
            session.add(perm)
    
    session.commit()
    
    # Roles
    admin_role = session.scalar(select(Role).where(Role.name == "Admin"))
    if not admin_role:
        admin_role = Role(name="Admin", slug="admin", description="Full system access", is_system=True)
        session.add(admin_role)
        session.commit()
        
        # Assign all permissions to admin
        all_perms = session.scalars(select(Permission)).all()
        for perm in all_perms:
            rp = RolePermission(role_id=admin_role.id, permission_id=perm.id)
            session.add(rp)
        session.commit()
    
    print(f"✓ Roles and permissions seeded")

def seed_categories(session: Session):
    """Seed product categories"""
    for cat_data in CATEGORIES_DATA:
        cat = session.scalar(select(Category).where(Category.slug == cat_data["slug"]))
        if not cat:
            cat = Category(**cat_data)
            session.add(cat)
    session.commit()
    print(f"✓ {len(CATEGORIES_DATA)} categories seeded")

def seed_merchants(session: Session):
    """Seed merchants"""
    for idx, merch_data in enumerate(MERCHANTS_DATA, 1):
        merch = session.scalar(select(Merchant).where(Merchant.slug == merch_data["slug"]))
        if not merch:
            merch = Merchant(
                name=merch_data["name"],
                slug=merch_data["slug"],
                logo_url=f"/images/merchants/merchant-{idx}.png",
                description=merch_data.get("description", f"{merch_data['name']} - Great deals and offers"),
                is_active=True
            )
            session.add(merch)
        else:
            # Update existing merchant with logo
            merch.logo_url = f"/images/merchants/merchant-{idx}.png"
    session.commit()
    print(f"✓ {len(MERCHANTS_DATA)} merchants seeded")

def seed_offers(session: Session):
    """Seed offers for merchants"""
    merchants = session.scalars(select(Merchant)).all()
    
    offers_created = 0
    for merchant in merchants:
        # Check if offers already exist for this merchant
        existing = session.scalar(select(Offer).where(Offer.merchant_id == merchant.id))
        if existing:
            continue
            
        # Create 3 offers per merchant with images
        offer_images = [f"/images/offers/{i}.png" for i in [8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 23, 24, 25, 26, 27, 29, 30, 33, 34, 35, 37, 38, 39, 41, 42, 49, 55, 60, 62, 63]]
        
        offer1 = Offer(
            merchant_id=merchant.id,
            title=f"{merchant.name} - Flat 50% Off",
            code=f"{merchant.slug.upper()}50",
            image_url=offer_images[(offers_created * 2) % len(offer_images)],
            is_active=True,
            priority=10,
            starts_at=datetime.utcnow(),
            ends_at=datetime.utcnow() + timedelta(days=30)
        )
        session.add(offer1)
        offers_created += 1
        
        offer2 = Offer(
            merchant_id=merchant.id,
            title=f"Exclusive {merchant.name} Deal",
            code=None,  # No code required
            image_url=offer_images[(offers_created * 2 + 1) % len(offer_images)],
            is_active=True,
            priority=5,
            starts_at=datetime.utcnow(),
            ends_at=datetime.utcnow() + timedelta(days=15)
        )
        session.add(offer2)
        offers_created += 1
        
        offer3 = Offer(
            merchant_id=merchant.id,
            title=f"{merchant.name} Cashback Fiesta",
            code=f"{merchant.slug.upper()}CASH",
            image_url=offer_images[(offers_created * 2 + 2) % len(offer_images)],
            is_active=True,
            priority=7,
            starts_at=datetime.utcnow(),
            ends_at=datetime.utcnow() + timedelta(days=45)
        )
        session.add(offer3)
        offers_created += 1
    
    session.commit()
    print(f"✓ {offers_created} offers seeded")

def seed_gift_cards(session: Session):
    """Seed gift card products"""
    merchants = {m.slug: m for m in session.scalars(select(Merchant)).all()}
    
    # Gift card images available
    gc_images = [f"/images/gift-cards/{i}.png" for i in range(1, 64)]
    
    giftcards_created = 0
    for idx, gc_data in enumerate(GIFT_CARDS_DATA):
        merchant_slug = gc_data["slug"].split("-")[0]  # Extract merchant from slug
        merchant = merchants.get(merchant_slug)
        
        if not merchant:
            continue
        
        gc = session.scalar(select(Product).where(Product.slug == gc_data["slug"]))
        if not gc:
            gc = Product(
                merchant_id=merchant.id,
                name=gc_data["name"],
                slug=gc_data["slug"],
                image_url=gc_images[idx % len(gc_images)],
                price=1000.0,  # Base price
                stock=1000,
                is_active=True
            )
            session.add(gc)
            session.flush()
            giftcards_created += 1
            
            # Add variants (denominations) with mix of smaller and bigger values
            denominations = [100, 250, 500, 750, 1000, 2000, 3000, 5000, 7500, 10000, 15000]
            for idx, denom in enumerate(denominations):
                if denom >= gc_data["min_value"] and denom <= gc_data["max_value"]:
                    variant = ProductVariant(
                        product_id=gc.id,
                        sku=f"{gc_data['slug']}-{denom}",
                        name=f"₹{denom}",
                        price=float(denom),
                        stock=1000
                    )
                    session.add(variant)
    
    session.commit()
    print(f"✓ {giftcards_created} gift cards with variants seeded")

    
    session.commit()
    print(f"✓ {len(GIFT_CARDS_DATA)} gift cards with variants seeded")

def main():
    print("🌱 Starting database seeding...\n")
    
    with Session(engine) as session:
        try:
            seed_admin_user(session)
            seed_roles_permissions(session)
            seed_categories(session)
            seed_merchants(session)
            seed_offers(session)
            seed_gift_cards(session)
            
            print("\n✅ Database seeding completed successfully!")
            print("\n📊 Summary:")
            print(f"   - Admin user: admin@couponali.com / admin123")
            print(f"   - Merchants: {len(session.scalars(select(Merchant)).all())}")
            print(f"   - Categories: {len(session.scalars(select(Category)).all())}")
            print(f"   - Offers: {len(session.scalars(select(Offer)).all())}")
            print(f"   - Gift Cards/Products: {len(session.scalars(select(Product)).all())}")
            print(f"   - Variants: {len(session.scalars(select(ProductVariant)).all())}")
            
        except Exception as e:
            print(f"\n❌ Error during seeding: {e}")
            session.rollback()
            raise

if __name__ == "__main__":
    main()
