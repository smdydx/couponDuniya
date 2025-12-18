"""
Professional seed script to populate database with LARGE amount of sample data (500+ items)
Run: python -m backend.scripts.seed_large_data
"""
import sys
import os
import random
import string
import json
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Merchant, Offer, Product, ProductVariant, Banner, Category, User, SocialAccount
from app.core.security import get_password_hash

# --- Simple Fake Data Generators (No external dependencies) ---

ADJECTIVES = ["Super", "Mega", "Hyper", "Ultra", "Best", "Top", "Prime", "Elite", "Pro", "Max", "Smart", "Eco", "Green", "Urban", "Global", "Next", "Swift", "Quick", "Happy", "Lucky"]
NOUNS = ["Mart", "Store", "Shop", "Bazaar", "Hub", "Zone", "World", "Planet", "City", "Village", "Point", "Center", "Station", "Market", "Mall", "Kart", "Deal", "Save", "Choice", "Select"]
CATEGORIES = ["Fashion", "Electronics", "Groceries", "Dining", "Travel", "Entertainment", "Health", "Beauty", "Home", "Sports"]
FIRST_NAMES = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayan", "Krishna", "Ishaan", "Diya", "Saanvi", "Anya", "Aadhya", "Pari", "Ananya", "Myra", "Riya", "Meera", "Sara"]
LAST_NAMES = ["Sharma", "Verma", "Gupta", "Malhotra", "Bhatia", "Mehta", "Jain", "Agarwal", "Reddy", "Nair", "Patel", "Singh", "Kumar", "Das", "Rao", "Joshi", "Chopra", "Khanna", "Saxena", "Iyer"]

def fake_name():
    return f"{random.choice(ADJECTIVES)} {random.choice(NOUNS)} {random.randint(1, 99)}"

def fake_slug(name):
    return name.lower().replace(" ", "-") + "-" + "".join(random.choices(string.ascii_lowercase + string.digits, k=6))

def fake_user_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def fake_email(name):
    return f"{name.lower().replace(' ', '.')}@example.com"

def fake_mobile():
    return f"+91{random.randint(6000000000, 9999999999)}"

# --- Main Seeding Logic ---

def seed_database():
    """Seed database with large volume of data"""
    print("🌱 Starting LARGE database seeding (500+ items)...")

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Clear existing data
        print("🧹 Cleaning existing data...")
        # Order matters due to foreign keys
        db.query(ProductVariant).delete()
        db.query(Product).delete()
        db.query(Offer).delete()
        db.query(Merchant).delete()
        db.query(Category).delete()
        db.query(SocialAccount).delete()
        # Keep admin users if possible, or just delete all and recreate specific ones
        # For simplicity in this script, we delete non-superusers or just all users 
        # But let's delete all and recreate a consistent admin
        db.query(User).delete()
        db.commit()

        # 1. Create Users
        print("👥 Creating 50+ Users...")
        users = []
        
        # Admin User
        admin_user = User(
            email="admin@example.com",
            full_name="Super Admin",
            password_hash=get_password_hash("admin123"),
            is_active=True,
            is_verified=True,
            is_admin=True,
            role="admin",
            mobile="+919876543210",
            mobile_verified_at=datetime.utcnow()
        )
        users.append(admin_user)

        # Regular Customers
        for _ in range(50):
            fullname = fake_user_name()
            users.append(User(
                email=fake_email(fullname + str(random.randint(100,999))),
                full_name=fullname,
                password_hash=get_password_hash("password123"),
                is_active=True,
                is_verified=random.choice([True, True, False]), # Mostly verified
                is_admin=False,
                role="customer",
                mobile=fake_mobile(),
                mobile_verified_at=datetime.utcnow() if random.random() > 0.3 else None
            ))
        
        db.add_all(users)
        db.commit()
        print(f"   Created {len(users)} users.")

        # 2. Create Categories
        print("📁 Creating Categories...")
        categories = []
        for i, cat_name in enumerate(CATEGORIES):
            categories.append(Category(
                name=cat_name,
                slug=fake_slug(cat_name),
                icon_url=f"/images/icons/1000{i}.svg",
                is_active=True
            ))
        db.add_all(categories)
        db.commit()
        print(f"   Created {len(categories)} categories.")

        # 3. Create Merchants
        print("🏪 Creating 100 Merchants...")
        merchants = []
        real_brands = ["Amazon", "Flipkart", "Myntra", "Ajio", "Swiggy", "Zomato", "Uber", "Ola", "Dominos", "KFC", "Nike", "Adidas", "Puma", "Samsung", "Apple", "Sony", "Dell", "HP", "Lenovo", "Asus"]
        
        # Add Real Brands first
        for brand in real_brands:
            merchants.append(Merchant(
                name=brand,
                slug=fake_slug(brand), # unique slug
                logo_url=f"https://logo.clearbit.com/{brand.lower()}.com", # Using clearbit for real-ish logos or placeholders
                # fallback to placeholder if needed in frontend
                description=f"Official {brand} Store. Best deals on {brand} products.",
                is_active=True,
                is_featured=random.random() > 0.7,
                is_verified=True,
                total_offers=random.randint(5, 50),
                commission_rate=random.uniform(1.0, 15.0),
                cashback_rate=random.uniform(1.0, 10.0)
            ))
            
        # Add Fake Merchants to reach ~100
        for _ in range(80):
            m_name = fake_name()
            merchants.append(Merchant(
                name=m_name,
                slug=fake_slug(m_name),
                logo_url="", # Empty to test fallback
                description=f"Best place for {m_name}. Shop now!",
                is_active=True,
                is_featured=random.random() > 0.8,
                is_verified=random.random() > 0.5,
                total_offers=random.randint(0, 20),
                commission_rate=random.uniform(1.0, 12.0),
                cashback_rate=random.uniform(0.5, 8.0)
            ))
            
        db.add_all(merchants)
        db.commit()
        print(f"   Created {len(merchants)} merchants.")

        # 4. Create Offers
        print("🎁 Creating 200+ Offers...")
        offers = []
        for merchant in merchants:
            # Generate 0-5 offers per merchant
            num_offers = random.randint(0, 5)
            for _ in range(num_offers):
                discount = random.choice([10, 20, 25, 30, 40, 50, 60, 70, 80])
                offers.append(Offer(
                    merchant_id=merchant.id,
                    title=f"Flat {discount}% OFF on all items",
                    description=f"Get flat {discount}% discount on minimum purchase of ₹{random.choice([500, 1000, 1500])}",
                    code=f"{merchant.slug[:3].upper()}{discount}",
                    is_active=True,
                    is_featured=merchant.is_featured and random.random() > 0.5,
                    is_exclusive=random.random() > 0.8,
                    start_date=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                    end_date=datetime.utcnow() + timedelta(days=random.randint(10, 60)),
                    terms_conditions="Valid for new users only. Max discount ₹500."
                ))
        
        db.add_all(offers)
        db.commit()
        print(f"   Created {len(offers)} offers.")

        # 5. Create Products (Gift Cards)
        print("💳 Creating 150+ Products/Gift Cards...")
        products = []
        for merchant in merchants:
            # Generate 0-3 products per merchant
            if random.random() > 0.3: # 70% chance a merchant has gift cards
                num_products = random.randint(1, 3)
                for _ in range(num_products):
                    cat = random.choice(categories)
                    products.append(Product(
                        merchant_id=merchant.id,
                        category_id=cat.id,
                        name=f"{merchant.name} Gift Card",
                        slug=fake_slug(f"{merchant.name}-gift-card"),
                        description=f"Buy {merchant.name} e-gift cards instantly. Valid for 1 year.",
                        price=1000.00, # Base price
                        stock=random.randint(100, 10000),
                        is_active=True,
                        is_bestseller=random.random() > 0.8,
                        is_featured=random.random() > 0.9
                    ))

        db.add_all(products)
        db.commit()
        print(f"   Created {len(products)} products.")

        # 6. Create Product Variants
        print("📦 Creating Product Variants...")
        variants = []
        denominations = [100, 250, 500, 1000, 2000, 5000]
        for product in products:
            for denom in random.sample(denominations, k=random.randint(1, 4)):
                variants.append(ProductVariant(
                    product_id=product.id,
                    name=f"₹{denom}",
                    sku=f"{product.slug}-{denom}",
                    denomination=denom,
                    price=denom, # Face value
                    selling_price=denom * (1 - random.uniform(0.01, 0.10)), # 1-10% discount
                    stock=random.randint(50, 500),
                    is_available=True
                ))
        
        db.add_all(variants)
        db.commit()
        print(f"   Created {len(variants)} variants.")

        print("\n✅ Database populated SUCCESSFULLY!")
        print(f"📊 Total Stats:")
        print(f"   - Users: {len(users)}")
        print(f"   - Categories: {len(categories)}")
        print(f"   - Merchants: {len(merchants)}")
        print(f"   - Offers: {len(offers)}")
        print(f"   - Products: {len(products)}")
        print(f"   - Variants: {len(variants)}")
        print("\nAdmin Creds: admin@example.com / admin123")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
