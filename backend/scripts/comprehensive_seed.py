import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database import SessionLocal
from app.models import User, Category, Merchant, Offer, PromoCode
import random
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def seed_database():
    db = SessionLocal()
    try:
        # Clear
        db.query(Offer).delete()
        db.query(PromoCode).delete()
        db.query(Merchant).delete()
        db.query(User).delete()
        db.query(Category).delete()
        db.commit()
        
        # Categories
        categories = [
            Category(name="Fashion", slug="fashion", level=0, is_active=True, is_visible_in_menu=True),
            Category(name="Electronics", slug="electronics", level=0, is_active=True, is_visible_in_menu=True),
            Category(name="Food & Dining", slug="food-dining", level=0, is_active=True, is_visible_in_menu=True),
            Category(name="Travel", slug="travel", level=0, is_active=True, is_visible_in_menu=True),
            Category(name="Entertainment", slug="entertainment", level=0, is_active=True, is_visible_in_menu=True),
            Category(name="Beauty & Health", slug="beauty-health", level=0, is_active=True, is_visible_in_menu=True),
            Category(name="Home & Living", slug="home-living", level=0, is_active=True, is_visible_in_menu=True),
            Category(name="Sports", slug="sports", level=0, is_active=True, is_visible_in_menu=True),
            Category(name="Books", slug="books", level=0, is_active=True, is_visible_in_menu=True),
            Category(name="Gifts", slug="gifts", level=0, is_active=True, is_visible_in_menu=True),
        ]
        db.add_all(categories)
        db.commit()
        print(f"✅ {len(categories)} categories")
        
        # Merchants
        merchants = [
            Merchant(name="Amazon", slug="amazon", logo_url="/images/merchants/amazon.png", is_active=True, is_verified=True, verification_status="approved"),
            Merchant(name="Flipkart", slug="flipkart", logo_url="/images/merchants/flipkart.png", is_active=True, is_verified=True, verification_status="approved"),
            Merchant(name="Myntra", slug="myntra", logo_url="/images/merchants/myntra.png", is_active=True, is_verified=True, verification_status="approved"),
            Merchant(name="Ajio", slug="ajio", logo_url="/images/merchants/ajio.png", is_active=True, is_verified=True, verification_status="approved"),
            Merchant(name="Swiggy", slug="swiggy", logo_url="/images/merchants/swiggy.png", is_active=True, is_verified=True, verification_status="approved"),
            Merchant(name="BookMyShow", slug="bookmyshow", logo_url="/images/merchants/bookmyshow.png", is_active=True, is_verified=True, verification_status="approved"),
            Merchant(name="Zomato", slug="zomato", logo_url="/images/merchants/zomato.png", is_active=True, is_verified=True, verification_status="approved"),
            Merchant(name="Nykaa", slug="nykaa", logo_url="/images/merchants/nykaa.png", is_active=True, is_verified=True, verification_status="approved"),
        ]
        db.add_all(merchants)
        db.commit()
        print(f"✅ {len(merchants)} merchants")
        
        # Offers
        offers = []
        for merchant in merchants:
            for j in range(4):
                offer = Offer(title=f"{merchant.name} Deal {j+1}", merchant_id=merchant.id, is_active=True)
                offers.append(offer)
        db.add_all(offers)
        db.commit()
        print(f"✅ {len(offers)} offers")
        
        # Users
        users = []
        for i in range(20):
            user = User(
                email=f"user{i+1}@bidua.in",
                email_normalized=f"user{i+1}@bidua.in",
                mobile=f"9876543{str(i).zfill(3)}",
                password_hash=pwd_context.hash("Test@123"),
                full_name=f"User {i+1}",
                is_active=True, is_verified=True, status="active"
            )
            users.append(user)
        db.add_all(users)
        db.commit()
        print(f"✅ {len(users)} users")
        print("\n✨ Database seeded successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
