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
from app.models import *
from app.security import get_password_hash
from datetime import datetime, timedelta
import uuid

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)

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
        
        # Create roles
        roles_data = [
            ("admin", "Administrator - Full access"),
            ("merchant", "Merchant - Can manage their offers"),
            ("support", "Support Team - Handle support tickets"),
            ("analyst", "Analyst - View analytics"),
        ]
        
        roles_map = {}
        for name, desc in roles_data:
            role = session.scalar(select(Role).where(Role.name == name))
            if not role:
                role = Role(name=name, description=desc)
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
        
        # 2. Create Categories
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
            ("Sports & Fitness", "sports-fitness", "Sports equipment and fitness"),
        ]
        
        categories_map = {}
        for name, slug, desc in categories_data:
            cat = session.scalar(select(Category).where(Category.slug == slug))
            if not cat:
                cat = Category(
                    name=name,
                    slug=slug,
                    description=desc,
                    icon="shopping-bag"
                )
                session.add(cat)
                session.flush()
            categories_map[slug] = cat
        
        session.commit()
        print("✓ Categories created")
        
        # 3. Create Merchants
        print("\n🏪 Creating merchants...")
        merchants_data = [
            {
                "name": "Amazon",
                "slug": "amazon",
                "description": "India's largest online marketplace",
                "website": "https://amazon.in",
                "image_url": "/images/merchants/amazon.jpg",
                "categories": ["electronics", "fashion", "home-living"],
            },
            {
                "name": "Flipkart",
                "slug": "flipkart",
                "description": "Big Billion Days and more",
                "website": "https://flipkart.com",
                "image_url": "/images/merchants/flipkart.png",
                "categories": ["electronics", "fashion", "home-living"],
            },
            {
                "name": "Myntra",
                "slug": "myntra",
                "description": "Fashion & lifestyle destination",
                "website": "https://myntra.com",
                "image_url": "/images/merchants/myntra.png",
                "categories": ["fashion"],
            },
            {
                "name": "Swiggy",
                "slug": "swiggy",
                "description": "Food delivery at your doorstep",
                "website": "https://swiggy.com",
                "image_url": "/images/merchants/swiggy.png",
                "categories": ["food-dining"],
            },
            {
                "name": "BookMyShow",
                "slug": "bookmyshow",
                "description": "Movie & event bookings",
                "website": "https://bookmyshow.com",
                "image_url": "/images/merchants/bookmyshow.png",
                "categories": ["entertainment"],
            },
            {
                "name": "Uber",
                "slug": "uber",
                "description": "Ride & food delivery",
                "website": "https://uber.com",
                "image_url": "/images/merchants/uber.png",
                "categories": ["travel", "food-dining"],
            },
            {
                "name": "BigBasket",
                "slug": "bigbasket",
                "description": "Online grocery shopping",
                "website": "https://bigbasket.com",
                "image_url": "/images/merchants/bigbasket.png",
                "categories": ["groceries"],
            },
            {
                "name": "Nykaa",
                "slug": "nykaa",
                "description": "Beauty and wellness store",
                "website": "https://nykaa.com",
                "image_url": "/images/merchants/myntra.png",
                "categories": ["health-beauty"],
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
                    website=merchant_data["website"],
                    image_url=merchant_data["image_url"],
                    status="active",
                    verified=True,
                    tier="premium",
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
        
        # 4. Create Admin User
        print("\n👤 Creating admin user...")
        admin = session.scalar(select(User).where(User.email == "admin@couponali.com"))
        if not admin:
            admin = User(
                email="admin@couponali.com",
                password_hash=get_password_hash("admin123"),
                full_name="Admin User",
                phone="+919876543210",
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
        
        # 5. Create Test Users
        print("\n👥 Creating test users...")
        test_users_data = [
            {
                "email": "user@example.com",
                "password": "user123",
                "full_name": "Test User",
                "phone": "+919876543211",
            },
            {
                "email": "merchant@couponali.com",
                "password": "merchant123",
                "full_name": "Test Merchant",
                "phone": "+919876543212",
            },
        ]
        
        for user_data in test_users_data:
            user = session.scalar(select(User).where(User.email == user_data["email"]))
            if not user:
                user = User(
                    email=user_data["email"],
                    password_hash=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    phone=user_data["phone"],
                    referral_code=f"REF{uuid.uuid4().hex[:8].upper()}",
                    is_active=True,
                    is_verified=True,
                    status="active",
                    role="user",
                )
                session.add(user)
                session.flush()
        
        session.commit()
        print("✓ Test users created")
        
        # 6. Create Offers
        print("\n🎁 Creating offers...")
        now = datetime.utcnow()
        offers_data = [
            {
                "merchant_id_ref": "amazon",
                "title": "Get 20% cashback on electronics",
                "description": "Shop for electronics and get 20% cashback. Applicable on purchases above ₹2000",
                "discount_type": "percentage",
                "discount_value": 20,
                "max_discount": 2000,
                "min_purchase": 2000,
                "category_id_ref": "electronics",
            },
            {
                "merchant_id_ref": "flipkart",
                "title": "₹500 cashback on fashion",
                "description": "Get ₹500 cashback on fashion purchases above ₹1500",
                "discount_type": "flat",
                "discount_value": 500,
                "max_discount": 500,
                "min_purchase": 1500,
                "category_id_ref": "fashion",
            },
            {
                "merchant_id_ref": "swiggy",
                "title": "Get 50% off on food delivery (max ₹200)",
                "description": "First time users get 50% off. Maximum discount ₹200",
                "discount_type": "percentage",
                "discount_value": 50,
                "max_discount": 200,
                "min_purchase": 300,
                "category_id_ref": "food-dining",
            },
            {
                "merchant_id_ref": "myntra",
                "title": "Flat 10% cashback on all products",
                "description": "Shop anything and get 10% cashback on all products",
                "discount_type": "percentage",
                "discount_value": 10,
                "max_discount": 1000,
                "min_purchase": 500,
                "category_id_ref": "fashion",
            },
            {
                "merchant_id_ref": "bookmyshow",
                "title": "₹200 off on movie tickets",
                "description": "Get ₹200 off on movie tickets. Valid on weekends",
                "discount_type": "flat",
                "discount_value": 200,
                "max_discount": 200,
                "min_purchase": 200,
                "category_id_ref": "entertainment",
            },
        ]
        
        for offer_data in offers_data:
            merchant = merchants_map.get(offer_data["merchant_id_ref"])
            category = categories_map.get(offer_data["category_id_ref"])
            
            if merchant and category:
                offer = session.scalar(
                    select(Offer).where(Offer.title == offer_data["title"])
                )
                if not offer:
                    offer = Offer(
                        merchant_id=merchant.id,
                        category_id=category.id,
                        title=offer_data["title"],
                        description=offer_data["description"],
                        discount_type=offer_data["discount_type"],
                        discount_value=offer_data["discount_value"],
                        max_discount=offer_data.get("max_discount", 0),
                        min_purchase=offer_data.get("min_purchase", 0),
                        start_date=now,
                        end_date=now + timedelta(days=30),
                        status="active",
                        is_featured=True,
                        click_count=0,
                        view_count=0,
                    )
                    session.add(offer)
        
        session.commit()
        print("✓ Offers created")
        
        # 7. Create Gift Cards
        print("\n🎫 Creating gift cards...")
        gift_cards_data = [
            {
                "name": "Amazon Pay Gift Card",
                "slug": "amazon-pay",
                "image_url": "/images/gift-cards/amazon.jpg",
                "description": "Buy Amazon gifts and redeem for shopping",
                "min_value": 100,
                "max_value": 10000,
            },
            {
                "name": "Flipkart Gift Card",
                "slug": "flipkart-gc",
                "image_url": "/images/gift-cards/flipkart.png",
                "description": "Shop anything on Flipkart",
                "min_value": 100,
                "max_value": 10000,
            },
            {
                "name": "Myntra Gift Voucher",
                "slug": "myntra-voucher",
                "image_url": "/images/gift-cards/myntra.png",
                "description": "Fashion shopping at Myntra",
                "min_value": 500,
                "max_value": 5000,
            },
            {
                "name": "Swiggy Money",
                "slug": "swiggy-money",
                "image_url": "/images/gift-cards/swiggy.png",
                "description": "Order food from favorite restaurants",
                "min_value": 100,
                "max_value": 2000,
            },
            {
                "name": "BookMyShow Voucher",
                "slug": "bms-voucher",
                "image_url": "/images/gift-cards/bookmyshow.png",
                "description": "Watch movies and events",
                "min_value": 200,
                "max_value": 3000,
            },
        ]
        
        for gc_data in gift_cards_data:
            gc = session.scalar(select(GiftCard).where(GiftCard.slug == gc_data["slug"]))
            if not gc:
                gc = GiftCard(
                    name=gc_data["name"],
                    slug=gc_data["slug"],
                    image_url=gc_data["image_url"],
                    description=gc_data["description"],
                    min_value=gc_data["min_value"],
                    max_value=gc_data["max_value"],
                    status="active",
                )
                session.add(gc)
        
        session.commit()
        print("✓ Gift cards created")
        
        # 8. Create Products (Gift Card Products)
        print("\n📦 Creating products...")
        for gc_data in gift_cards_data:
            product = session.scalar(select(Product).where(Product.title == gc_data["name"]))
            if not product:
                product = Product(
                    title=gc_data["name"],
                    slug=gc_data["slug"],
                    description=gc_data["description"],
                    price=gc_data["min_value"],
                    image_url=gc_data["image_url"],
                    category_id=categories_map["groceries"].id,
                    status="active",
                    is_gift_card=True,
                )
                session.add(product)
                session.flush()
                
                # Add variants
                variant = ProductVariant(
                    product_id=product.id,
                    sku=f"GC-{gc_data['slug'].upper()}-1000",
                    name=f"₹1000 {gc_data['name']}",
                    price=1000,
                    stock=100,
                )
                session.add(variant)
        
        session.commit()
        print("✓ Products created")
        
        # 9. Create Wallet & Cashback Data
        print("\n💰 Creating wallet data...")
        for user_email in ["user@example.com", "merchant@couponali.com"]:
            user = session.scalar(select(User).where(User.email == user_email))
            if user:
                balance = session.scalar(
                    select(WalletBalance).where(WalletBalance.user_id == user.id)
                )
                if not balance:
                    balance = WalletBalance(
                        user_id=user.id,
                        balance=5000.00,
                        cashback_balance=2500.00,
                        total_earned=10000.00,
                        total_redeemed=2000.00,
                    )
                    session.add(balance)
                    session.flush()
                    
                    # Add sample transactions
                    transaction1 = WalletTransaction(
                        user_id=user.id,
                        amount=500.00,
                        type="credit",
                        description="Cashback from Amazon purchase",
                        reference_id=f"ORDER-{uuid.uuid4().hex[:8].upper()}",
                        balance_after=5500.00,
                    )
                    session.add(transaction1)
                    
                    transaction2 = WalletTransaction(
                        user_id=user.id,
                        amount=100.00,
                        type="debit",
                        description="Withdrawal to bank",
                        reference_id=f"WITHDRAW-{uuid.uuid4().hex[:8].upper()}",
                        balance_after=5400.00,
                    )
                    session.add(transaction2)
        
        session.commit()
        print("✓ Wallet data created")
        
        # 10. Create Support Department
        print("\n🏢 Creating departments...")
        dept = session.scalar(select(Department).where(Department.name == "Support"))
        if not dept:
            dept = Department(
                name="Support",
                description="Customer support team",
                is_active=True,
            )
            session.add(dept)
        
        session.commit()
        print("✓ Departments created")
        
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
