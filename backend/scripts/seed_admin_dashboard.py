"""
Seed script to add test data for admin dashboard
"""
import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import User, Merchant, Offer, Product, Order, WalletBalance
from app.database import SessionLocal, engine, Base
from app.security import get_password_hash

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Create session
db = SessionLocal()

def seed_data():
    print("🌱 Seeding admin dashboard data...")
    
    try:
        # Create test users
        if db.query(User).count() < 5:
            print("Creating test users...")
            for i in range(5):
                user = User(
                    email=f"user{i+1}@test.com",
                    mobile=f"900000000{i}",
                    full_name=f"Test User {i+1}",
                    password_hash=get_password_hash("password123"),
                    is_verified=True,
                    role="user"
                )
                db.add(user)
                
            db.commit()
            
            # Add wallet balances after users are committed to get their IDs
            for user in db.query(User).filter(User.role == "user").all():
                existing_wallet = db.query(WalletBalance).filter(WalletBalance.user_id == user.id).first()
                if not existing_wallet:
                    wallet = WalletBalance(user_id=user.id, balance=100.0)
                    db.add(wallet)
            
            db.commit()
            print("✅ Created 5 test users with wallets")
        
        # Create test merchants
        if db.query(Merchant).count() < 3:
            print("Creating test merchants...")
            merchants = [
                Merchant(name="Amazon", slug="amazon", is_active=True, is_featured=True),
                Merchant(name="Flipkart", slug="flipkart", is_active=True, is_featured=True),
                Merchant(name="Myntra", slug="myntra", is_active=True, is_featured=False)
            ]
            for merchant in merchants:
                db.add(merchant)
            db.commit()
            print("✅ Created 3 test merchants")
        
        # Create test offers
        merchants = db.query(Merchant).all()
        if merchants and db.query(Offer).count() < 5:
            print("Creating test offers...")
            for i, merchant in enumerate(merchants):
                offer = Offer(
                    merchant_id=merchant.id,
                    title=f"{merchant.name} Sale {i+1}",
                    code=f"SAVE{i+1}0",
                    is_active=True,
                    is_featured=(i < 2),
                    is_exclusive=(i < 1),
                    priority=10 - i
                )
                db.add(offer)
            db.commit()
            print("✅ Created test offers")
        
        # Create test products with variants
        if merchants and db.query(Product).count() < 3:
            print("Creating test products...")
            from app.models import ProductVariant
            import uuid
            for i, merchant in enumerate(merchants[:2]):
                product = Product(
                    merchant_id=merchant.id,
                    name=f"{merchant.name} Gift Card",
                    slug=f"{merchant.slug}-gift-card",
                    sku=f"GC-{merchant.slug.upper()}-{uuid.uuid4().hex[:6]}",
                    is_active=True,
                    is_featured=True,
                    is_bestseller=True
                )
                db.add(product)
                db.flush()  # Get product ID
                
                # Add variants
                for denom in [100, 250, 500, 1000]:
                    variant = ProductVariant(
                        product_id=product.id,
                        denomination=denom,
                        selling_price=denom * 0.95,  # 5% discount
                        cost_price=denom * 0.85,
                        discount_percentage=5.0,
                        is_available=True,
                        stock_quantity=50
                    )
                    db.add(variant)
            db.commit()
            print("✅ Created test products with variants")
        
        # Create test orders
        users = db.query(User).filter(User.role == "user").all()
        if users and db.query(Order).count() < 3:
            print("Creating test orders...")
            for i, user in enumerate(users[:3]):
                # Today's order
                order = Order(
                    user_id=user.id,
                    order_number=f"ORD{datetime.now().strftime('%Y%m%d')}{i+1:04d}",
                    total_amount=500.0 + (i * 100),
                    payment_status="paid",
                    fulfillment_status="fulfilled",
                    created_at=datetime.utcnow()
                )
                db.add(order)
            
            # Older order
            old_order = Order(
                user_id=users[0].id,
                order_number=f"ORD{(datetime.now() - timedelta(days=7)).strftime('%Y%m%d')}0001",
                total_amount=1000.0,
                payment_status="paid",
                fulfillment_status="fulfilled",
                created_at=datetime.utcnow() - timedelta(days=7)
            )
            db.add(old_order)
            db.commit()
            print("✅ Created test orders")
        
        print("\n🎉 Admin dashboard seeding complete!")
        print("\n📊 Current data:")
        print(f"   Users: {db.query(User).count()}")
        print(f"   Merchants: {db.query(Merchant).count()}")
        print(f"   Offers: {db.query(Offer).count()}")
        print(f"   Products: {db.query(Product).count()}")
        print(f"   Orders: {db.query(Order).count()}")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
