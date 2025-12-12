"""
Comprehensive Seed Script - Populates all database tables with realistic data
Run: python comprehensive_seed.py
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import (
    User, Category, Merchant, Product, ProductVariant, Offer, 
    Order, OrderItem, Banner, Brand, Pincode, Address, PromoCode,
    PaymentResponse, wallet, WalletBalance, WalletTransaction
)
from datetime import datetime, timedelta
import random
import uuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def seed_database():
    """Comprehensive database seeding"""
    db = SessionLocal()
    
    try:
        print("🌱 Starting comprehensive database seeding...\n")
        
        # 1. CLEAR EXISTING DATA
        print("🧹 Clearing existing data...")
        db.query(WalletTransaction).delete()
        db.query(WalletBalance).delete()
        db.query(PaymentResponse).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(ProductVariant).delete()
        db.query(Product).delete()
        db.query(PromoCode).delete()
        db.query(Offer).delete()
        db.query(Merchant).delete()
        db.query(Banner).delete()
        db.query(Brand).delete()
        db.query(Pincode).delete()
        db.query(Address).delete()
        db.query(User).delete()
        db.query(Category).delete()
        db.commit()
        print("✅ Cleared old data\n")
        
        # 2. SEED CATEGORIES (10 categories)
        print("📁 Creating 10 Categories...")
        categories_data = [
            {"name": "Fashion", "slug": "fashion", "level": 0},
            {"name": "Electronics", "slug": "electronics", "level": 0},
            {"name": "Food & Dining", "slug": "food-dining", "level": 0},
            {"name": "Travel", "slug": "travel", "level": 0},
            {"name": "Entertainment", "slug": "entertainment", "level": 0},
            {"name": "Beauty & Health", "slug": "beauty-health", "level": 0},
            {"name": "Home & Living", "slug": "home-living", "level": 0},
            {"name": "Sports", "slug": "sports", "level": 0},
            {"name": "Books", "slug": "books", "level": 0},
            {"name": "Gifts", "slug": "gifts", "level": 0},
        ]
        
        categories = []
        for cat in categories_data:
            category = Category(
                name=cat["name"],
                slug=cat["slug"],
                level=cat["level"],
                is_active=True,
                is_visible_in_menu=True,
                default_tax_rate=18.0,
                display_mode="products"
            )
            categories.append(category)
        db.add_all(categories)
        db.commit()
        print(f"✅ Created {len(categories)} categories\n")
        
        # 3. SEED BRANDS (15 brands)
        print("🏷️ Creating 15 Brands...")
        brand_names = [
            "Nike", "Adidas", "Puma", "Apple", "Samsung", "Sony", "LG",
            "Gucci", "Zara", "H&M", "Decathlon", "Bata", "Loreal", "Lakme", "Himalaya"
        ]
        
        brands = []
        for brand_name in brand_names:
            brand = Brand(
                name=brand_name,
                slug=brand_name.lower().replace(" ", "-"),
                is_active=True
            )
            brands.append(brand)
        db.add_all(brands)
        db.commit()
        print(f"✅ Created {len(brands)} brands\n")
        
        # 4. SEED MERCHANTS (12 merchants)
        print("🏪 Creating 12 Merchants...")
        merchant_data = [
            ("Amazon", "amazon", "/images/merchants/amazon.png", True),
            ("Flipkart", "flipkart", "/images/merchants/flipkart.png", True),
            ("Myntra", "myntra", "/images/merchants/myntra.png", True),
            ("Ajio", "ajio", "/images/merchants/ajio.png", True),
            ("Swiggy", "swiggy", "/images/merchants/swiggy.png", True),
            ("BookMyShow", "bookmyshow", "/images/merchants/bookmyshow.png", True),
            ("Uber", "uber", "/images/merchants/uber.png", False),
            ("Starbucks", "starbucks", "/images/merchants/starbucks.png", False),
            ("Zomato", "zomato", "/images/merchants/zomato.png", True),
            ("Ola", "ola", "/images/merchants/ola.png", False),
            ("Nykaa", "nykaa", "/images/merchants/nykaa.png", True),
            ("Snapdeal", "snapdeal", "/images/merchants/snapdeal.png", False),
        ]
        
        merchants = []
        for name, slug, logo, featured in merchant_data:
            merchant = Merchant(
                name=name,
                slug=slug,
                logo_url=logo,
                description=f"Get amazing deals and cashback on {name}",
                business_type="individual",
                account_status="active",
                is_active=True,
                is_featured=featured,
                is_verified=random.choice([True, False]),
                commission_rate=random.uniform(5, 15),
                default_shipping_days=random.randint(2, 7),
                return_window_days=7,
                seller_tier="bronze" if random.random() > 0.5 else "silver",
                acceptance_rate=random.uniform(85, 99),
                order_fulfillment_rate=random.uniform(85, 99),
                on_time_delivery_rate=random.uniform(80, 99),
                return_rate=random.uniform(0, 5),
                cancellation_rate=random.uniform(0, 5),
            )
            merchants.append(merchant)
        db.add_all(merchants)
        db.commit()
        print(f"✅ Created {len(merchants)} merchants\n")
        
        # 5. SEED BANNERS (15 banners)
        print("🎨 Creating 15 Banners...")
        banners = []
        for i in range(3):  # 3 hero banners
            banner = Banner(
                title=f"Huge Sale {i+1}",
                banner_type="hero",
                image_url=f"https://images.unsplash.com/photo-160708234{i}?w=1200&h=400&fit=crop",
                is_active=True,
                order_index=i
            )
            banners.append(banner)
        
        for i, merchant in enumerate(merchants[:12]):  # 12 promo banners
            banner = Banner(
                title=f"{merchant.name} Special Offer",
                banner_type="promo",
                brand_name=merchant.name,
                headline=f"Get up to {random.randint(20, 70)}% OFF",
                badge_text=f"{random.randint(20, 70)}% OFF",
                code=f"CODE{i+1}",
                is_active=True,
                order_index=i
            )
            banners.append(banner)
        
        db.add_all(banners)
        db.commit()
        print(f"✅ Created {len(banners)} banners\n")
        
        # 6. SEED OFFERS (40 offers)
        print("🎁 Creating 40 Offers...")
        offers = []
        for merchant in merchants:
            # 3-4 offers per merchant
            for j in range(random.randint(3, 4)):
                offer = Offer(
                    merchant_id=merchant.id,
                    title=f"{merchant.name} Offer {j+1}: Flat {random.randint(10, 50)}% OFF",
                    code=f"{merchant.slug.upper()}{j+1}{random.randint(100, 999)}",
                    image_url=f"/images/offers/{random.randint(1, 50)}.png",
                    is_active=random.choice([True, False]),
                    is_featured=random.choice([True, False]),
                    is_exclusive=random.choice([True, False]),
                    priority=random.randint(1, 10),
                    start_date=datetime.utcnow(),
                    end_date=datetime.utcnow() + timedelta(days=random.randint(7, 60))
                )
                offers.append(offer)
        
        db.add_all(offers)
        db.commit()
        print(f"✅ Created {len(offers)} offers\n")
        
        # 7. SEED USERS (20 users)
        print("👥 Creating 20 Users...")
        users = []
        email_list = [
            f"user{i}@example.com" for i in range(1, 21)
        ]
        
        for i, email in enumerate(email_list):
            user = User(
                uuid=str(uuid.uuid4()),
                email=email,
                email_normalized=email.lower(),
                password_hash=hash_password("password123"),
                full_name=f"User {i+1}",
                first_name=f"User",
                last_name=f"{i+1}",
                referral_code=f"REF{random.randint(100000, 999999)}",
                wallet_balance=random.uniform(0, 5000),
                pending_cashback=random.uniform(0, 1000),
                total_earnings=random.uniform(0, 10000),
                status="active",
                is_active=True,
                is_verified=random.choice([True, False]),
                is_admin=False,
                role="user",
                auth_provider="email",
                email_verified_at=datetime.utcnow(),
                mobile=f"9{random.randint(100000000, 999999999)}",
                mobile_country_code="+91",
                gender=random.choice(["M", "F", "Other"]),
                date_of_birth="1990-01-01"
            )
            users.append(user)
        
        db.add_all(users)
        db.commit()
        print(f"✅ Created {len(users)} users\n")
        
        # 8. SEED PRODUCTS (60 products - 5 per merchant)
        print("📦 Creating 60 Products...")
        products = []
        product_counter = 0
        
        for merchant in merchants:
            for idx in range(5):
                product_counter += 1
                category = random.choice(categories)
                brand = random.choice(brands) if random.random() > 0.3 else None
                
                product = Product(
                    merchant_id=merchant.id,
                    name=f"{merchant.name} Product {idx+1}",
                    slug=f"{merchant.slug}-product-{idx+1}".lower(),
                    sku=f"SKU{product_counter:04d}",
                    description=f"High quality product from {merchant.name}",
                    short_description="Great quality and affordable price",
                    category_id=category.id,
                    brand_id=brand.id if brand else None,
                    price=random.uniform(100, 5000),
                    mrp=random.uniform(500, 10000),
                    cost_price=random.uniform(50, 2000),
                    stock=random.randint(10, 500),
                    tax_rate=18.0,
                    image_url=f"/images/products/{product_counter}.jpg",
                    is_active=True,
                    is_featured=random.choice([True, False]),
                    is_bestseller=random.choice([True, False]),
                    is_new_arrival=random.choice([True, False]),
                    status="draft" if random.random() > 0.7 else "active",
                    manage_stock=True,
                    low_stock_threshold=10,
                    is_shippable=True,
                    free_shipping=random.choice([True, False]),
                    is_returnable=True,
                    return_window_days=7,
                    min_order_quantity=1,
                    product_type="simple",
                    weight=random.uniform(0.5, 10),
                    weight_unit="kg",
                    dimension_unit="cm",
                    tax_inclusive=True,
                    is_cod_available=True,
                    average_rating=random.uniform(3, 5),
                    total_reviews=random.randint(0, 100),
                    view_count=random.randint(0, 1000),
                    order_count=random.randint(0, 500),
                )
                products.append(product)
        
        db.add_all(products)
        db.commit()
        print(f"✅ Created {len(products)} products\n")
        
        # 9. SEED PRODUCT VARIANTS (180 variants - 3 per product)
        print("🔀 Creating 180 Product Variants...")
        variants = []
        colors = ["Red", "Blue", "Green", "Black", "White", "Yellow", "Gray"]
        sizes = ["XS", "S", "M", "L", "XL", "XXL"]
        
        for product in products:
            for v_idx in range(3):
                variant = ProductVariant(
                    product_id=product.id,
                    sku=f"{product.sku}-V{v_idx+1}",
                    name=f"Variant {v_idx+1}",
                    color=random.choice(colors) if random.random() > 0.5 else None,
                    size=random.choice(sizes) if random.random() > 0.5 else None,
                    price=product.price * random.uniform(0.8, 1.2),
                    stock=random.randint(5, 100),
                    is_available=random.choice([True, False]),
                    barcode=f"BARCODE{product.id}{v_idx+1}",
                )
                variants.append(variant)
        
        db.add_all(variants)
        db.commit()
        print(f"✅ Created {len(variants)} product variants\n")
        
        # 10. SEED PROMO CODES (20 promo codes)
        print("🏷️ Creating 20 Promo Codes...")
        promo_codes = []
        for i in range(20):
            promo = PromoCode(
                code=f"PROMO{i+1:04d}",
                description=f"Discount Promo Code {i+1}",
                discount_type="percentage" if random.random() > 0.5 else "fixed",
                discount_value=random.choice([10, 15, 20, 25, 30, 500, 1000]),
                min_order_value=random.choice([100, 500, 1000, 2000]),
                max_discount=random.choice([1000, 2000, 5000]),
                usage_limit=random.randint(10, 1000),
                usage_per_user=random.randint(1, 10),
                is_active=random.choice([True, False]),
                start_date=datetime.utcnow(),
                end_date=datetime.utcnow() + timedelta(days=random.randint(30, 365)),
            )
            promo_codes.append(promo)
        
        db.add_all(promo_codes)
        db.commit()
        print(f"✅ Created {len(promo_codes)} promo codes\n")
        
        # 11. SEED PINCODES (100 pincodes)
        print("📍 Creating 100 Pincodes...")
        pincodes = []
        major_cities = [
            ("Mumbai", "400001"), ("Delhi", "110001"), ("Bangalore", "560001"),
            ("Pune", "411001"), ("Hyderabad", "500001"), ("Chennai", "600001"),
            ("Kolkata", "700001"), ("Ahmedabad", "380001"), ("Jaipur", "302001"),
            ("Lucknow", "226001")
        ]
        
        for _ in range(100):
            city, base_pincode = random.choice(major_cities)
            pincode = int(base_pincode) + random.randint(0, 1000)
            
            pin = Pincode(
                code=str(pincode),
                city=city,
                state="State",
                country="India",
                lat=random.uniform(8.0, 35.0),
                lng=random.uniform(68.0, 97.0),
                is_active=random.choice([True, False]),
                cod_available=random.choice([True, False]),
            )
            pincodes.append(pin)
        
        db.add_all(pincodes)
        db.commit()
        print(f"✅ Created {len(pincodes)} pincodes\n")
        
        # 12. SEED ADDRESSES (40 addresses)
        print("🏠 Creating 40 User Addresses...")
        addresses = []
        for user in users[:20]:  # First 20 users get 2 addresses each
            for addr_idx in range(2):
                address = Address(
                    user_id=user.id,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    email=user.email,
                    phone=user.mobile,
                    address_line_1=f"{random.randint(1, 999)} Main Street",
                    address_line_2="Apartment 101",
                    city=random.choice([c[0] for c in major_cities]),
                    state="State Name",
                    pincode=str(int("400001") + random.randint(0, 10000)),
                    country="India",
                    address_type=random.choice(["home", "work"]),
                    is_default=addr_idx == 0,
                    is_active=True,
                )
                addresses.append(address)
        
        db.add_all(addresses)
        db.commit()
        print(f"✅ Created {len(addresses)} addresses\n")
        
        # 13. SEED WALLETS (20 wallets)
        print("💰 Creating 20 Wallets...")
        wallets = []
        for user in users:
            wallet = Wallet(
                user_id=user.id,
                balance=user.wallet_balance,
                pending_balance=user.pending_cashback,
                total_credited=user.total_earnings,
                is_active=True,
            )
            wallets.append(wallet)
        
        db.add_all(wallets)
        db.commit()
        print(f"✅ Created {len(wallets)} wallets\n")
        
        # 14. SEED WALLET BALANCES
        print("📊 Creating Wallet Balances...")
        wallet_balances = []
        for wallet in wallets:
            wb = WalletBalance(
                wallet_id=wallet.id,
                available_balance=wallet.balance,
                hold_balance=0,
                refund_balance=0,
            )
            wallet_balances.append(wb)
        
        db.add_all(wallet_balances)
        db.commit()
        print(f"✅ Created {len(wallet_balances)} wallet balances\n")
        
        # 15. SEED WALLET TRANSACTIONS (100 transactions)
        print("💳 Creating 100 Wallet Transactions...")
        transactions = []
        for _ in range(100):
            wallet = random.choice(wallets)
            transaction = WalletTransaction(
                wallet_id=wallet.id,
                transaction_type=random.choice(["credit", "debit"]),
                amount=random.uniform(10, 5000),
                description=f"Transaction {random.choice(['Cashback', 'Refund', 'Purchase', 'Reward'])}",
                transaction_date=datetime.utcnow() - timedelta(days=random.randint(0, 90)),
                status="completed",
                reference_id=f"TXN{random.randint(100000, 999999)}",
            )
            transactions.append(transaction)
        
        db.add_all(transactions)
        db.commit()
        print(f"✅ Created {len(transactions)} wallet transactions\n")
        
        # 16. SEED ORDERS (30 orders)
        print("📦 Creating 30 Orders...")
        orders = []
        order_statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
        
        for i in range(30):
            user = random.choice(users)
            order = Order(
                user_id=user.id,
                order_number=f"ORD{datetime.utcnow().strftime('%Y%m%d')}{i:04d}",
                merchant_id=random.choice(merchants).id if random.random() > 0.3 else None,
                subtotal=random.uniform(500, 10000),
                tax_amount=random.uniform(50, 1000),
                shipping_cost=random.choice([0, 50, 100, 200]),
                total_amount=random.uniform(500, 15000),
                discount_amount=random.uniform(0, 2000),
                cashback_amount=random.uniform(0, 1000),
                status=random.choice(order_statuses),
                payment_status=random.choice(["pending", "completed", "failed"]),
                payment_method=random.choice(["credit_card", "debit_card", "wallet", "cod"]),
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 90)),
                updated_at=datetime.utcnow(),
                special_instructions="Please deliver after 6 PM",
            )
            orders.append(order)
        
        db.add_all(orders)
        db.commit()
        print(f"✅ Created {len(orders)} orders\n")
        
        # 17. SEED ORDER ITEMS (90 order items)
        print("📋 Creating 90 Order Items...")
        order_items = []
        for order in orders:
            # 2-4 items per order
            for _ in range(random.randint(2, 4)):
                product = random.choice(products)
                quantity = random.randint(1, 5)
                item_price = product.price
                
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_variant_id=random.choice([v.id for v in variants if v.product_id == product.id]),
                    quantity=quantity,
                    price=item_price,
                    subtotal=item_price * quantity,
                    discount_percentage=random.choice([0, 5, 10, 15, 20]),
                    tax_percentage=18.0,
                    total=item_price * quantity,
                )
                order_items.append(order_item)
        
        db.add_all(order_items)
        db.commit()
        print(f"✅ Created {len(order_items)} order items\n")
        
        # 18. SEED PAYMENT RESPONSES (30 payment responses)
        print("💰 Creating 30 Payment Responses...")
        payment_responses = []
        for order in orders:
            payment = PaymentResponse(
                order_id=order.id,
                payment_gateway="razorpay",
                payment_id=f"pay_{random.randint(100000000, 999999999)}",
                amount=order.total_amount,
                currency="INR",
                status=random.choice(["authorized", "captured", "failed", "refunded"]),
                response_code=random.choice(["0", "1", "2"]),
                response_message=random.choice(["Success", "Failed", "Pending"]),
                created_at=order.created_at,
            )
            payment_responses.append(payment)
        
        db.add_all(payment_responses)
        db.commit()
        print(f"✅ Created {len(payment_responses)} payment responses\n")
        
        print("\n" + "="*60)
        print("✅ DATABASE SEEDING COMPLETE!")
        print("="*60)
        print(f"""
📊 SUMMARY:
  ✓ Categories: {len(categories)}
  ✓ Brands: {len(brands)}
  ✓ Merchants: {len(merchants)}
  ✓ Banners: {len(banners)}
  ✓ Offers: {len(offers)}
  ✓ Users: {len(users)}
  ✓ Products: {len(products)}
  ✓ Variants: {len(variants)}
  ✓ Promo Codes: {len(promo_codes)}
  ✓ Pincodes: {len(pincodes)}
  ✓ Addresses: {len(addresses)}
  ✓ Wallets: {len(wallets)}
  ✓ Wallet Transactions: {len(transactions)}
  ✓ Orders: {len(orders)}
  ✓ Order Items: {len(order_items)}
  ✓ Payment Responses: {len(payment_responses)}

🎉 TOTAL RECORDS: {sum([len(categories), len(brands), len(merchants), len(banners), len(offers), len(users), len(products), len(variants), len(promo_codes), len(pincodes), len(addresses), len(wallets), len(transactions), len(orders), len(order_items), len(payment_responses)])}
        """)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error seeding database: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
