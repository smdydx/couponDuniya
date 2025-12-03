
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Category

CATEGORIES = [
    {"name": "Fashion", "slug": "fashion"},
    {"name": "Electronics", "slug": "electronics"},
    {"name": "Food & Dining", "slug": "food-dining"},
    {"name": "Travel", "slug": "travel"},
    {"name": "Entertainment", "slug": "entertainment"},
    {"name": "Health & Beauty", "slug": "health-beauty"},
    {"name": "Home & Living", "slug": "home-living"},
    {"name": "Baby & Kids", "slug": "baby-kids"},
    {"name": "Sports & Fitness", "slug": "sports-fitness"},
    {"name": "Books & Stationery", "slug": "books-stationery"},
]

def seed_categories():
    db: Session = SessionLocal()
    try:
        for cat_data in CATEGORIES:
            existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
            if not existing:
                category = Category(**cat_data, is_active=True)
                db.add(category)
                print(f"Added category: {cat_data['name']}")
            else:
                print(f"Category already exists: {cat_data['name']}")
        
        db.commit()
        print("\n✅ Categories seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding categories: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_categories()
