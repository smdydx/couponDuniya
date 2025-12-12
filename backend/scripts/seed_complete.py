#!/usr/bin/env python3
"""
Comprehensive seed script for CouponAli platform
Creates test data for all models
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models import (
    User, Role, Permission, RolePermission, Department,
    Category, Merchant, MerchantCategory, Offer, GiftCard,
    Product, ProductVariant, WalletBalance, WalletTransaction,
    Banner
)
from app.security import get_password_hash
from datetime import datetime, timedelta
import uuid

settings = get_settings()
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
engine = create_engine(database_url)

def seed_database():
    with Session(engine) as session:
        print("🌱 Starting database seed...")
        
        # 1. Create Roles and Permissions
        print("\n📋 Creating roles and permissions...")
        permissions_data = [
            ("users.read", "View users"),
            ("users.write", "Manage users"),
            ("merchants.read", "View merchants"),
            ("merchants.write", "Manage merchants"),
            ("offers.read", "View offers"),
            ("offers.write", "Manage offers"),
            ("products.read", "View products"),
            ("products.write", "Manage products"),
            ("orders.read", "View orders"),
            ("orders.write", "Manage orders"),
            ("analytics.read", "View analytics"),
            ("finance.read", "View finance"),
            ("finance.write", "Manage finance"),
            ("support.read", "View support tickets"),
            ("support.write", "Manage support tickets"),
        ]
        
        permissions_map = {}
        for code, desc in permissions_data:
            perm = session.scalar(select(Permission).where(Permission.code == code))
            if not perm:
                perm = Permission(code=code, description=desc)
                session.add(perm)
                session.flush()
            permissions_map[code] = perm
        
        # Create roles (now with slug)
        roles_data = [
            ("admin", "admin", "Administrator - Full access"),
            ("merchant", "merchant", "Merchant - Can manage their offers"),
            ("support", "support", "Support Team - Handle support tickets"),
            ("analyst", "analyst", "Analyst - View analytics"),
        ]
        
        roles_map = {}
        for name, slug, desc in roles_data:
            role = session.scalar(select(Role).where(Role.name == name))
            if not role:
                role = Role(name=name, slug=slug, description=desc)
                session.add(role)
                session.flush()
            roles_map[name] = role
        
        # Assign permissions to admin role
        admin_role = roles_map["admin"]
        for perm in permissions_map.values():
            existing = session.scalar(
                select(RolePermission).where(
                    (RolePermission.role_id == admin_role.id) &
                    (RolePermission.permission_id == perm.id)
                )
            )
            if not existing:
                session.add(RolePermission(role_id=admin_role.id, permission_id=perm.id))
        
        session.commit()
        print("✓ Roles and permissions created")
        
        # 2. Create Departments
        print("\n🏢 Creating departments...")
        departments_data = [
            ("Support", "support", "Customer support team"),
            ("Sales", "sales", "Sales team"),
            ("Marketing", "marketing", "Marketing team"),
            ("Operations", "operations", "Operations team"),
        ]
        
        for name, slug, desc in departments_data:
            dept = session.scalar(select(Department).where(Department.slug == slug))
            if not dept:
                dept = Department(name=name, slug=slug, description=desc, is_active=True)
                session.add(dept)
        
        session.commit()
        print("✓ Departments created")
        
        # 3. Create Categories
        print("\n🏷️  Creating categories...")
        categories_data = [
            ("Fashion", "fashion", "Clothing, shoes, and accessories"),
            ("Electronics", "electronics", "Mobile phones, laptops, and gadgets"),
            ("Food & Dining", "food-dining", "Restaurants and food delivery"),
            ("Travel", "travel", "Flight, hotel, and cab bookings"),
            ("Entertainment", "entertainment", "Movies, shows, and games"),
            ("Groceries", "groceries", "Online grocery shopping"),
            ("Health & Beauty", "health-beauty", "Beauty, wellness, and health products"),
            ("Home & Living", "home-living", "Furniture and home appliances"),
            ("Baby & Kids", "baby-kids", "Products for babies and children"),
            ("Pharmacy", "pharmacy", "Medicines and medical supplies"),
        ]
        
        categories_map = {}
        for name, slug, desc in categories_data:
            cat = session.scalar(select(Category).where(Category.slug == slug))
            if not cat:
                cat = Category(
                    name=name,
                    slug=slug,
                    description=desc,
                    is_active=True,
                    is_featured=True
                )
                session.add(cat)
                session.flush()
            categories_map[slug] = cat
        
        session.commit()
        print("✓ Categories created")
        
        # 4. Create Merchants
        print("\n🏪 Creating merchants...")
        merchants_data = [
            {
                "name": "Amazon",
                "slug": "amazon",
                "description": "India's largest online marketplace",
                "logo_url": "/images/merchants/amazon.jpg",
                "categories": ["electronics", "fashion", "home-living"],
            },
            {
                "name": "Flipkart",
                "slug": "flipkart",
                "description": "Big Billion Days and more",
                "logo_url": "/images/merchants/flipkart.png",
                "categories": ["electronics", "fashion", "home-living"],
            },
            {
                "name": "Myntra",
                "slug": "myntra",
                "description": "Fashion & lifestyle destination",
                "logo_url": "/images/merchants/myntra.png",
                "categories": ["fashion"],
            },
            {
                "name": "Swiggy",
                "slug": "swiggy",
                "description": "Food delivery at your doorstep",
                "logo_url": "/images/merchants/swiggy.png",
                "categories": ["food-dining"],
            },
            {
                "name": "BookMyShow",
                "slug": "bookmyshow",
                "description": "Movie & event bookings",
                "logo_url": "/images/merchants/bookmyshow.png",
                "categories": ["entertainment"],
            },
            {
                "name": "Uber",
                "slug": "uber",
                "description": "Ride & food delivery",
                "logo_url": "/images/merchants/uber.png",
                "categories": ["travel", "food-dining"],
            },
            {
                "name": "Ajio",
                "slug": "ajio",
                "description": "Trendy fashion & accessories",
                "logo_url": "/images/merchants/ajio.png",
                "categories": ["fashion"],
            },
            {
                "name": "FirstCry",
                "slug": "firstcry",
                "description": "Baby & kids store",
                "logo_url": "/images/merchants/firstcry.png",
                "categories": ["baby-kids"],
            },
        ]
        
        merchants_map = {}
        for merchant_data in merchants_data:
            merchant = session.scalar(select(Merchant).where(Merchant.slug == merchant_data["slug"]))
            if not merchant:
                merchant = Merchant(
                    name=merchant_data["name"],
                    slug=merchant_data["slug"],
                    description=merchant_data["description"],
                    logo_url=merchant_data["logo_url"],
                    status="approved",
                    verification_status="approved",
                    is_active=True,
                    is_featured=True,
                )
                session.add(merchant)
                session.flush()
            
            # Add merchant-category mappings
            for cat_slug in merchant_data["categories"]:
                if cat_slug in categories_map:
                    cat = categories_map[cat_slug]
                    mc = session.scalar(
                        select(MerchantCategory).where(
                            (MerchantCategory.merchant_id == merchant.id) &
                            (MerchantCategory.category_id == cat.id)
                        )
                    )
                    if not mc:
                        session.add(MerchantCategory(merchant_id=merchant.id, category_id=cat.id))
            
            merchants_map[merchant_data["slug"]] = merchant
        
        session.commit()
        print("✓ Merchants created")
        
        # 5. Create Admin User
        print("\n👤 Creating admin user...")
        admin = session.scalar(select(User).where(User.email == "admin@couponali.com"))
        if not admin:
            admin = User(
                email="admin@couponali.com",
                email_normalized="admin@couponali.com",
                password_hash=get_password_hash("admin123"),
                full_name="Admin User",
                mobile="+919876543210",
                referral_code=f"ADMIN{uuid.uuid4().hex[:6].upper()}",
                is_active=True,
                is_admin=True,
                is_verified=True,
                role="admin",
                status="active",
            )
            session.add(admin)
            session.flush()
        print(f"✓ Admin user created/updated (email: admin@couponali.com, password: admin123)")
        
        # 6. Create Test Users
        print("\n👥 Creating test users...")
        test_users_data = [
            {
                "email": "user@example.com",
                "password": "user123",
                "full_name": "Test User",
                "mobile": "+919876543211",
            },
            {
                "email": "merchant@couponali.com",
                "password": "merchant123",
                "full_name": "Test Merchant",
                "mobile": "+919876543212",
            },
        ]
        
        test_users = {}
        for user_data in test_users_data:
            user = session.scalar(select(User).where(User.email == user_data["email"]))
            if not user:
                user = User(
                    email=user_data["email"],
                    email_normalized=user_data["email"],
                    password_hash=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    mobile=user_data["mobile"],
                    referral_code=f"REF{uuid.uuid4().hex[:8].upper()}",
                    is_active=True,
                    is_verified=True,
                    status="active",
                    role="customer",
                )
                session.add(user)
                session.flush()
            test_users[user_data["email"]] = user
        
        session.commit()
        print("✓ Test users created")
        
        # 7. Create Offers
        print("\n🎁 Creating offers...")
        now = datetime.utcnow()
        offers_data = [
            {"merchant": "amazon", "title": "Get 20% cashback on electronics", "code": "AMAZON20", "featured": True, "exclusive": False},
            {"merchant": "flipkart", "title": "₹500 off on fashion", "code": "FLIP500", "featured": True, "exclusive": False},
            {"merchant": "swiggy", "title": "50% off on food delivery (max ₹200)", "code": "SWIGGY50", "featured": True, "exclusive": True},
            {"merchant": "myntra", "title": "Flat 10% cashback on all products", "code": "MYNTRA10", "featured": True, "exclusive": False},
            {"merchant": "bookmyshow", "title": "₹200 off on movie tickets", "code": "BMS200", "featured": True, "exclusive": True},
            {"merchant": "uber", "title": "₹100 off on first ride", "code": "UBER100", "featured": False, "exclusive": True},
            {"merchant": "ajio", "title": "Extra 15% off on all orders", "code": "AJIO15", "featured": True, "exclusive": False},
            {"merchant": "firstcry", "title": "Flat ₹300 off on baby products", "code": "BABY300", "featured": True, "exclusive": False},
        ]
        
        for offer_data in offers_data:
            merchant = merchants_map.get(offer_data["merchant"])
            if merchant:
                offer = session.scalar(select(Offer).where(Offer.code == offer_data["code"]))
                if not offer:
                    offer = Offer(
                        merchant_id=merchant.id,
                        title=offer_data["title"],
                        code=offer_data["code"],
                        image_url=merchant.logo_url,
                        is_active=True,
                        is_featured=offer_data["featured"],
                        is_exclusive=offer_data["exclusive"],
                        priority=10 if offer_data["featured"] else 5,
                        start_date=now,
                        end_date=now + timedelta(days=30),
                    )
                    session.add(offer)
        
        session.commit()
        print("✓ Offers created")
        
        # 8. Create Gift Cards
        print("\n🎫 Creating gift cards...")
        for i in range(5):
            gc_code = f"GC{uuid.uuid4().hex[:8].upper()}"
            gc = session.scalar(select(GiftCard).where(GiftCard.code == gc_code))
            if not gc:
                gc = GiftCard(
                    code=gc_code,
                    initial_value=1000.00,
                    remaining_value=1000.00,
                    is_active=True,
                    expires_at=now + timedelta(days=365),
                )
                session.add(gc)
        
        session.commit()
        print("✓ Gift cards created")
        
        # 9. Create Products (Gift Card Products)
        print("\n📦 Creating products...")
        products_data = [
            {"name": "Amazon Pay Gift Card", "slug": "amazon-pay-gc", "sku": "AMZN-GC-001", "merchant": "amazon"},
            {"name": "Flipkart Gift Card", "slug": "flipkart-gc", "sku": "FLIP-GC-001", "merchant": "flipkart"},
            {"name": "Myntra Gift Voucher", "slug": "myntra-gc", "sku": "MYNT-GC-001", "merchant": "myntra"},
            {"name": "Swiggy Money", "slug": "swiggy-gc", "sku": "SWIG-GC-001", "merchant": "swiggy"},
            {"name": "BookMyShow Voucher", "slug": "bms-gc", "sku": "BMS-GC-001", "merchant": "bookmyshow"},
        ]
        
        for prod_data in products_data:
            product = session.scalar(select(Product).where(Product.sku == prod_data["sku"]))
            if not product:
                merchant = merchants_map.get(prod_data["merchant"])
                product = Product(
                    name=prod_data["name"],
                    slug=prod_data["slug"],
                    sku=prod_data["sku"],
                    description=f"{prod_data['name']} - Perfect for gifting",
                    image_url=merchant.logo_url if merchant else None,
                    merchant_id=merchant.id if merchant else None,
                    is_active=True,
                    is_featured=True,
                )
                session.add(product)
                session.flush()
                
                # Add variants
                for denom in [500, 1000, 2000, 5000]:
                    variant = ProductVariant(
                        product_id=product.id,
                        denomination=denom,
                        selling_price=denom * 0.95,  # 5% discount
                        cost_price=denom * 0.90,
                        discount_percentage=5.0,
                        is_available=True,
                        stock_quantity=100,
                    )
                    session.add(variant)
        
        session.commit()
        print("✓ Products created")
        
        # 10. Create Wallet Balances for Test Users
        print("\n💰 Creating wallet data...")
        for user_email, user in test_users.items():
            balance = session.scalar(select(WalletBalance).where(WalletBalance.user_id == user.id))
            if not balance:
                balance = WalletBalance(
                    user_id=user.id,
                    balance=5000.00,
                )
                session.add(balance)
                session.flush()
                
                # Add sample transactions
                transaction1 = WalletTransaction(
                    user_id=user.id,
                    amount=500.00,
                    type="credit",
                    description="Cashback from Amazon purchase",
                    reference=f"ORDER-{uuid.uuid4().hex[:8].upper()}",
                    balance_after=5500.00,
                )
                session.add(transaction1)
                
                transaction2 = WalletTransaction(
                    user_id=user.id,
                    amount=100.00,
                    type="debit",
                    description="Withdrawal to bank",
                    reference=f"WITHDRAW-{uuid.uuid4().hex[:8].upper()}",
                    balance_after=5400.00,
                )
                session.add(transaction2)
        
        session.commit()
        print("✓ Wallet data created")
        
        # 11. Create Banners
        print("\n🖼️  Creating banners...")
        banners_data = [
            {
                "title": "Amazon Great Indian Festival",
                "banner_type": "hero",
                "image_url": "/images/merchants/amazon.jpg",
                "brand_name": "Amazon",
                "headline": "Up to 80% Off",
                "description": "Shop now and save big on electronics, fashion, and more",
                "link_url": "/merchants/amazon",
                "order_index": 1,
            },
            {
                "title": "Flipkart Big Billion Days",
                "banner_type": "hero",
                "image_url": "/images/merchants/flipkart.png",
                "brand_name": "Flipkart",
                "headline": "Biggest Sale Ever",
                "description": "Exclusive deals on smartphones and electronics",
                "link_url": "/merchants/flipkart",
                "order_index": 2,
            },
            {
                "title": "Myntra Fashion Sale",
                "banner_type": "promo",
                "image_url": "/images/merchants/myntra.png",
                "brand_name": "Myntra",
                "headline": "50% Off on Fashion",
                "description": "Trending styles at amazing prices",
                "link_url": "/merchants/myntra",
                "order_index": 3,
            },
        ]
        
        for banner_data in banners_data:
            banner = session.scalar(select(Banner).where(Banner.title == banner_data["title"]))
            if not banner:
                banner = Banner(
                    title=banner_data["title"],
                    banner_type=banner_data["banner_type"],
                    image_url=banner_data["image_url"],
                    brand_name=banner_data["brand_name"],
                    headline=banner_data["headline"],
                    description=banner_data["description"],
                    link_url=banner_data["link_url"],
                    order_index=banner_data["order_index"],
                    is_active=True,
                )
                session.add(banner)
        
        session.commit()
        print("✓ Banners created")
        
        print("\n✅ Database seeding completed successfully!\n")
        print("📊 Test Credentials:")
        print("-" * 50)
        print("Admin User:")
        print("  Email: admin@couponali.com")
        print("  Password: admin123")
        print()
        print("Regular User:")
        print("  Email: user@example.com")
        print("  Password: user123")
        print()
        print("Merchant User:")
        print("  Email: merchant@couponali.com")
        print("  Password: merchant123")
        print("-" * 50)

if __name__ == "__main__":
    seed_database()
