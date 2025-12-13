"""
Comprehensive seed script to populate database with all initial data.
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
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.banner import Banner
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
        password_hash=pwd_context.hash("admin123"),
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
    print(f"Created admin user: {admin_email} / admin123")
    return admin


def seed_categories(db):
    """Create sample categories with icons."""
    categories_data = [
        {"name": "Electronics", "slug": "electronics", "description": "Latest gadgets and electronics deals", "icon_url": "https://cdn-icons-png.flaticon.com/512/3659/3659899.png"},
        {"name": "Fashion", "slug": "fashion", "description": "Clothing, shoes, and accessories", "icon_url": "https://cdn-icons-png.flaticon.com/512/3531/3531849.png"},
        {"name": "Food & Dining", "slug": "food-dining", "description": "Restaurant and food delivery offers", "icon_url": "https://cdn-icons-png.flaticon.com/512/1147/1147805.png"},
        {"name": "Travel", "slug": "travel", "description": "Hotels, flights, and vacation packages", "icon_url": "https://cdn-icons-png.flaticon.com/512/3125/3125713.png"},
        {"name": "Beauty & Health", "slug": "beauty-health", "description": "Skincare, makeup, and wellness", "icon_url": "https://cdn-icons-png.flaticon.com/512/2553/2553691.png"},
        {"name": "Home & Kitchen", "slug": "home-kitchen", "description": "Furniture and home appliances", "icon_url": "https://cdn-icons-png.flaticon.com/512/2553/2553073.png"},
        {"name": "Entertainment", "slug": "entertainment", "description": "Movies, games, and OTT platforms", "icon_url": "https://cdn-icons-png.flaticon.com/512/3163/3163478.png"},
        {"name": "Groceries", "slug": "groceries", "description": "Daily essentials and grocery stores", "icon_url": "https://cdn-icons-png.flaticon.com/512/3514/3514299.png"},
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
    """Create sample merchants with logos."""
    merchants_data = [
        {"name": "Amazon", "slug": "amazon", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/320px-Amazon_logo.svg.png", "description": "World's largest online retailer with millions of products", "is_featured": True},
        {"name": "Flipkart", "slug": "flipkart", "logo_url": "https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/flipkart-plus_8d85f4.png", "description": "India's leading e-commerce platform", "is_featured": True},
        {"name": "Myntra", "slug": "myntra", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Myntra_logo.png/220px-Myntra_logo.png", "description": "Fashion and lifestyle shopping destination", "is_featured": True},
        {"name": "Swiggy", "slug": "swiggy", "logo_url": "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/Swiggy_logo.svg/220px-Swiggy_logo.svg.png", "description": "Food delivery and dining offers", "is_featured": True},
        {"name": "Zomato", "slug": "zomato", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Zomato_logo.png/220px-Zomato_logo.png", "description": "Food delivery and restaurant discovery", "is_featured": True},
        {"name": "MakeMyTrip", "slug": "makemytrip", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/MakeMyTrip_Logo.png/220px-MakeMyTrip_Logo.png", "description": "Travel booking platform for flights and hotels", "is_featured": True},
        {"name": "Nykaa", "slug": "nykaa", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Nykaa_logo.png/220px-Nykaa_logo.png", "description": "Beauty and cosmetics online store", "is_featured": True},
        {"name": "BookMyShow", "slug": "bookmyshow", "logo_url": "https://in.bmscdn.com/webin/common/icons/logo.svg", "description": "Movie tickets and entertainment events", "is_featured": True},
        {"name": "Uber", "slug": "uber", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Uber_logo_2018.png/220px-Uber_logo_2018.png", "description": "Ride sharing and transportation", "is_featured": True},
        {"name": "Ajio", "slug": "ajio", "logo_url": "https://assets.ajio.com/static/img/Ajio-Logo.svg", "description": "Trendy fashion and lifestyle products", "is_featured": True},
        {"name": "BigBasket", "slug": "bigbasket", "logo_url": "https://www.bigbasket.com/media/uploads/banner_images/bb-logo.png", "description": "Online grocery shopping", "is_featured": True},
        {"name": "Paytm Mall", "slug": "paytm-mall", "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/220px-Paytm_Logo_%28standalone%29.svg.png", "description": "E-commerce platform with cashback offers", "is_featured": False},
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
        {"merchant_slug": "amazon", "title": "Flat 20% Off on Electronics", "code": "ELEC20", "is_featured": True, "is_exclusive": False, "priority": 10, "image_url": "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&h=400&fit=crop"},
        {"merchant_slug": "amazon", "title": "Up to 60% Off Fashion Sale", "code": "FASHION60", "is_featured": True, "is_exclusive": True, "priority": 9, "image_url": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop"},
        {"merchant_slug": "amazon", "title": "Prime Member Special - Extra 10%", "code": "PRIME10", "is_featured": False, "is_exclusive": True, "priority": 8, "image_url": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop"},
        {"merchant_slug": "flipkart", "title": "Big Billion Days - 70% Off", "code": "BBD70", "is_featured": True, "is_exclusive": False, "priority": 10, "image_url": "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=600&h=400&fit=crop"},
        {"merchant_slug": "flipkart", "title": "Extra 15% Off with Axis Card", "code": None, "is_featured": True, "is_exclusive": False, "priority": 7, "image_url": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"},
        {"merchant_slug": "myntra", "title": "End of Season Sale - 80% Off", "code": "EOSS80", "is_featured": True, "is_exclusive": False, "priority": 9, "image_url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop"},
        {"merchant_slug": "myntra", "title": "Buy 3 Get 2 Free on Fashion", "code": "BUY3GET2", "is_featured": True, "is_exclusive": True, "priority": 8, "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop"},
        {"merchant_slug": "swiggy", "title": "Free Delivery on Orders Above 149", "code": "FREEDEL", "is_featured": True, "is_exclusive": False, "priority": 8, "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop"},
        {"merchant_slug": "swiggy", "title": "60% Off on First Order", "code": "FIRST60", "is_featured": True, "is_exclusive": True, "priority": 10, "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop"},
        {"merchant_slug": "zomato", "title": "50% Off on Dining", "code": "DINE50", "is_featured": True, "is_exclusive": False, "priority": 9, "image_url": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop"},
        {"merchant_slug": "zomato", "title": "Pro Membership - 60% Off on Food", "code": "PRO60", "is_featured": True, "is_exclusive": True, "priority": 8, "image_url": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop"},
        {"merchant_slug": "makemytrip", "title": "Flat 25% Off on Domestic Flights", "code": "FLY25", "is_featured": True, "is_exclusive": False, "priority": 9, "image_url": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop"},
        {"merchant_slug": "makemytrip", "title": "Hotel Bookings at 40% Off", "code": "HOTEL40", "is_featured": True, "is_exclusive": True, "priority": 8, "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop"},
        {"merchant_slug": "nykaa", "title": "Buy 2 Get 1 Free on Lipsticks", "code": "LIPS321", "is_featured": True, "is_exclusive": False, "priority": 7, "image_url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop"},
        {"merchant_slug": "nykaa", "title": "Flat 30% Off on Skincare", "code": "SKIN30", "is_featured": True, "is_exclusive": True, "priority": 8, "image_url": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=400&fit=crop"},
        {"merchant_slug": "bookmyshow", "title": "Flat 150 Off on Movie Tickets", "code": "MOVIE150", "is_featured": True, "is_exclusive": False, "priority": 8, "image_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop"},
        {"merchant_slug": "uber", "title": "50% Off on First 5 Rides", "code": "RIDE50", "is_featured": True, "is_exclusive": True, "priority": 9, "image_url": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop"},
        {"merchant_slug": "ajio", "title": "Upto 70% Off + Extra 30%", "code": "AJIO30", "is_featured": True, "is_exclusive": False, "priority": 8, "image_url": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&h=400&fit=crop"},
        {"merchant_slug": "bigbasket", "title": "Free Delivery + 20% Off Groceries", "code": "GROCERY20", "is_featured": True, "is_exclusive": False, "priority": 7, "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop"},
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
                image_url=offer_data.get("image_url"),
                is_active=True,
                is_featured=offer_data["is_featured"],
                is_exclusive=offer_data.get("is_exclusive", False),
                priority=offer_data.get("priority", 5),
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=60),
            )
            db.add(offer)
            created += 1
    
    db.commit()
    print(f"Created {created} offers (skipped {len(offers_data) - created} existing)")


def seed_products(db):
    """Create sample products (gift cards) with variants."""
    merchants = db.query(Merchant).all()
    categories = db.query(Category).all()
    
    if not merchants:
        print("No merchants found, skipping products")
        return
    
    merchant_map = {m.slug: m for m in merchants}
    category_map = {c.slug: c for c in categories}
    
    products_data = [
        {"merchant": "amazon", "name": "Amazon Gift Card", "slug": "amazon-gift-card", "description": "Shop millions of products on Amazon India. Perfect gift for any occasion.", "image_url": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop", "price": 500, "category": "electronics", "is_featured": True, "is_bestseller": True},
        {"merchant": "flipkart", "name": "Flipkart Gift Voucher", "slug": "flipkart-gift-voucher", "description": "India's favorite shopping destination. Use for electronics, fashion & more.", "image_url": "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=600&h=400&fit=crop", "price": 500, "category": "electronics", "is_featured": True, "is_bestseller": True},
        {"merchant": "myntra", "name": "Myntra Fashion Card", "slug": "myntra-fashion-card", "description": "Latest fashion trends from top brands. Perfect for style lovers.", "image_url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop", "price": 1000, "category": "fashion", "is_featured": True, "is_bestseller": False},
        {"merchant": "swiggy", "name": "Swiggy Food Card", "slug": "swiggy-food-card", "description": "Order your favorite meals from thousands of restaurants.", "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop", "price": 500, "category": "food-dining", "is_featured": True, "is_bestseller": True},
        {"merchant": "zomato", "name": "Zomato Dining Card", "slug": "zomato-dining-card", "description": "Dine out or order in. Experience the best food in your city.", "image_url": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop", "price": 500, "category": "food-dining", "is_featured": True, "is_bestseller": False},
        {"merchant": "makemytrip", "name": "MakeMyTrip Gift Card", "slug": "makemytrip-gift-card", "description": "Book flights, hotels, and holiday packages. Travel made easy.", "image_url": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop", "price": 2000, "category": "travel", "is_featured": True, "is_bestseller": True},
        {"merchant": "nykaa", "name": "Nykaa Beauty Card", "slug": "nykaa-beauty-card", "description": "Premium beauty and skincare products from top brands.", "image_url": "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=400&fit=crop", "price": 1000, "category": "beauty-health", "is_featured": True, "is_bestseller": False},
        {"merchant": "bookmyshow", "name": "BookMyShow Gift Card", "slug": "bookmyshow-gift-card", "description": "Movie tickets, events, plays, and concerts. Entertainment unlimited.", "image_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop", "price": 500, "category": "entertainment", "is_featured": True, "is_bestseller": True},
        {"merchant": "uber", "name": "Uber Ride Card", "slug": "uber-ride-card", "description": "Safe and reliable rides anywhere in the city.", "image_url": "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop", "price": 500, "category": "travel", "is_featured": True, "is_bestseller": False},
        {"merchant": "ajio", "name": "AJIO Fashion Card", "slug": "ajio-fashion-card", "description": "Trendy fashion at best prices. Exclusive collections available.", "image_url": "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&h=400&fit=crop", "price": 1000, "category": "fashion", "is_featured": True, "is_bestseller": False},
        {"merchant": "bigbasket", "name": "BigBasket Grocery Card", "slug": "bigbasket-grocery-card", "description": "Daily essentials delivered to your doorstep. Fresh and quality products.", "image_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=400&fit=crop", "price": 500, "category": "groceries", "is_featured": True, "is_bestseller": True},
    ]
    
    created = 0
    for prod_data in products_data:
        merchant = merchant_map.get(prod_data["merchant"])
        category = category_map.get(prod_data["category"])
        
        if not merchant:
            continue
            
        existing = db.query(Product).filter(Product.slug == prod_data["slug"]).first()
        if not existing:
            product = Product(
                merchant_id=merchant.id,
                category_id=category.id if category else None,
                name=prod_data["name"],
                slug=prod_data["slug"],
                description=prod_data["description"],
                image_url=prod_data["image_url"],
                price=prod_data["price"],
                stock=100,
                is_active=True,
                is_featured=prod_data["is_featured"],
                is_bestseller=prod_data["is_bestseller"],
            )
            db.add(product)
            db.flush()
            
            denominations = [250, 500, 1000, 2000, 5000]
            for denom in denominations:
                variant = ProductVariant(
                    product_id=product.id,
                    sku=f"{product.slug}-{denom}",
                    name=f"Rs. {denom}",
                    price=denom,
                    stock=50,
                    is_available=True
                )
                db.add(variant)
            
            created += 1
    
    db.commit()
    print(f"Created {created} products with variants (skipped {len(products_data) - created} existing)")


def seed_banners(db):
    """Create hero and promo banners."""
    existing_count = db.query(Banner).count()
    if existing_count > 0:
        print(f"Banners already exist ({existing_count}), skipping...")
        return
    
    hero_banners = [
        Banner(
            title="Amazon Great Indian Festival",
            banner_type="hero",
            image_url="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop",
            brand_name="Amazon",
            badge_text="Up to 80% OFF",
            badge_color="#FF9900",
            headline="Great Indian Festival Sale",
            description="Biggest sale of the year with amazing discounts",
            link_url="https://amazon.in",
            order_index=0,
            is_active=True
        ),
        Banner(
            title="Flipkart Big Billion Days",
            banner_type="hero",
            image_url="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=1200&h=400&fit=crop",
            brand_name="Flipkart",
            badge_text="70% OFF",
            badge_color="#2874F0",
            headline="Big Billion Days",
            description="India's biggest shopping festival",
            link_url="https://flipkart.com",
            order_index=1,
            is_active=True
        ),
        Banner(
            title="Myntra Fashion Sale",
            banner_type="hero",
            image_url="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
            brand_name="Myntra",
            badge_text="End of Season",
            badge_color="#FF3F6C",
            headline="Fashion at Best Prices",
            description="Up to 80% off on top brands",
            link_url="https://myntra.com",
            order_index=2,
            is_active=True
        ),
        Banner(
            title="MakeMyTrip Travel Sale",
            banner_type="hero",
            image_url="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=400&fit=crop",
            brand_name="MakeMyTrip",
            badge_text="Flight Deals",
            badge_color="#EB2026",
            headline="Dream Destinations Await",
            description="Flat 25% off on domestic flights",
            link_url="https://makemytrip.com",
            order_index=3,
            is_active=True
        ),
    ]
    
    promo_banners = [
        Banner(
            title="Swiggy Food Offer",
            banner_type="promo",
            brand_name="Swiggy",
            badge_text="60% OFF",
            badge_color="#FF5722",
            headline="Order Food & Get 60% Off",
            description="Use code FOOD60 on orders above Rs 199",
            code="FOOD60",
            style_metadata='{"gradient": "from-orange-400 to-red-500", "emoji": "pizza"}',
            link_url="https://swiggy.com",
            order_index=0,
            is_active=True
        ),
        Banner(
            title="Zomato Dining",
            banner_type="promo",
            brand_name="Zomato",
            badge_text="50% OFF",
            badge_color="#E23744",
            headline="Dine Out & Save 50%",
            description="Exclusive dining offers at top restaurants",
            code="DINE50",
            style_metadata='{"gradient": "from-red-400 to-pink-500", "emoji": "fork_and_knife"}',
            link_url="https://zomato.com",
            order_index=1,
            is_active=True
        ),
        Banner(
            title="Uber Rides",
            banner_type="promo",
            brand_name="Uber",
            badge_text="40% OFF",
            badge_color="#000000",
            headline="Save on Every Ride",
            description="Get 40% off on your next 5 rides",
            code="UBER40",
            style_metadata='{"gradient": "from-gray-800 to-black", "emoji": "car"}',
            link_url="https://uber.com",
            order_index=2,
            is_active=True
        ),
        Banner(
            title="BookMyShow",
            banner_type="promo",
            brand_name="BookMyShow",
            badge_text="Rs 150 OFF",
            badge_color="#C4242B",
            headline="Movie Tickets at Best Price",
            description="Flat Rs 150 off on movie tickets",
            code="MOVIE150",
            style_metadata='{"gradient": "from-red-600 to-pink-600", "emoji": "movie_camera"}',
            link_url="https://bookmyshow.com",
            order_index=3,
            is_active=True
        ),
        Banner(
            title="Nykaa Beauty",
            banner_type="promo",
            brand_name="Nykaa",
            badge_text="Buy 2 Get 1",
            badge_color="#FC2779",
            headline="Beauty Products Sale",
            description="Buy 2 Get 1 Free on all makeup",
            code="BEAUTY321",
            style_metadata='{"gradient": "from-pink-400 to-purple-500", "emoji": "lipstick"}',
            link_url="https://nykaa.com",
            order_index=4,
            is_active=True
        ),
        Banner(
            title="BigBasket Groceries",
            banner_type="promo",
            brand_name="BigBasket",
            badge_text="20% OFF",
            badge_color="#84C225",
            headline="Fresh Groceries Delivered",
            description="Flat 20% off on first order",
            code="FRESH20",
            style_metadata='{"gradient": "from-green-400 to-green-600", "emoji": "shopping_cart"}',
            link_url="https://bigbasket.com",
            order_index=5,
            is_active=True
        ),
    ]
    
    for banner in hero_banners + promo_banners:
        db.add(banner)
    
    db.commit()
    print(f"Created {len(hero_banners)} hero banners and {len(promo_banners)} promo banners")


def seed_test_users(db):
    """Create test users for development."""
    test_users = [
        {"email": "user1@test.com", "full_name": "Test User One", "password": "test123"},
        {"email": "user2@test.com", "full_name": "Test User Two", "password": "test123"},
        {"email": "premium@test.com", "full_name": "Premium User", "password": "test123"},
    ]
    
    created = 0
    for user_data in test_users:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            user = User(
                email=user_data["email"],
                full_name=user_data["full_name"],
                password_hash=pwd_context.hash(user_data["password"]),
                is_verified=True,
                is_admin=False,
                is_active=True,
                role="user",
                auth_provider="email",
                email_verified_at=datetime.utcnow(),
            )
            db.add(user)
            created += 1
    
    db.commit()
    print(f"Created {created} test users (skipped {len(test_users) - created} existing)")


def main():
    print("=" * 50)
    print("Starting comprehensive database seeding...")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        seed_admin_user(db)
        seed_test_users(db)
        seed_categories(db)
        seed_merchants(db)
        seed_offers(db)
        seed_products(db)
        seed_banners(db)
        
        print("=" * 50)
        print("Seeding completed successfully!")
        print("=" * 50)
        print("\nAdmin Login: admin@couponali.com / admin123")
        print("Test User: user1@test.com / test123")
        print("\nData created:")
        print(f"  - Categories: {db.query(Category).count()}")
        print(f"  - Merchants: {db.query(Merchant).count()}")
        print(f"  - Offers: {db.query(Offer).count()}")
        print(f"  - Products: {db.query(Product).count()}")
        print(f"  - Banners: {db.query(Banner).count()}")
        print(f"  - Users: {db.query(User).count()}")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
