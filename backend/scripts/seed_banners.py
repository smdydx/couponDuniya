
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Banner

def seed_banners():
    db: Session = SessionLocal()
    
    try:
        # Clear existing banners
        db.query(Banner).delete()
        
        # Add hero banners
        hero_banners = [
            Banner(
                title="Amazon Great Sale",
                banner_type="hero",
                image_url="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop",
                link_url="https://amazon.in",
                order_index=0,
                is_active=True
            ),
            Banner(
                title="Flipkart Big Billion Days",
                banner_type="hero",
                image_url="https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=400&fit=crop",
                link_url="https://flipkart.com",
                order_index=1,
                is_active=True
            ),
            Banner(
                title="Myntra Fashion Sale",
                banner_type="hero",
                image_url="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
                link_url="https://myntra.com",
                order_index=2,
                is_active=True
            )
        ]
        
        # Add promotional banners
        promo_banners = [
            Banner(
                title="Swiggy Food Offer",
                banner_type="promo",
                brand_name="Swiggy",
                badge_text="60% OFF",
                badge_color="#FF5722",
                headline="Order Food & Get 60% Off",
                description="Use code FOOD60 on orders above ₹199",
                code="FOOD60",
                style_metadata='{"gradient": "from-orange-400 to-red-500", "emoji": "🍕"}',
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
                style_metadata='{"gradient": "from-red-400 to-pink-500", "emoji": "🍽️"}',
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
                style_metadata='{"gradient": "from-gray-800 to-black", "emoji": "🚗"}',
                link_url="https://uber.com",
                order_index=2,
                is_active=True
            ),
            Banner(
                title="BookMyShow",
                banner_type="promo",
                brand_name="BookMyShow",
                badge_text="₹150 OFF",
                badge_color="#C4242B",
                headline="Movie Tickets at Best Price",
                description="Flat ₹150 off on movie tickets",
                code="MOVIE150",
                style_metadata='{"gradient": "from-red-600 to-pink-600", "emoji": "🎬"}',
                link_url="https://bookmyshow.com",
                order_index=3,
                is_active=True
            )
        ]
        
        # Add all banners
        for banner in hero_banners + promo_banners:
            db.add(banner)
        
        db.commit()
        print(f"✅ Successfully seeded {len(hero_banners)} hero banners and {len(promo_banners)} promo banners!")
        
    except Exception as e:
        print(f"❌ Error seeding banners: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_banners()
