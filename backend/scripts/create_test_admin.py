
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import User
from app.security import get_password_hash
from datetime import datetime

def create_test_admin():
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@test.com").first()
        
        if admin:
            print("✅ Admin user already exists")
            print(f"   Email: admin@test.com")
            print(f"   Password: admin123")
            print(f"   Role: {admin.role}")
            return
        
        # Create admin user
        admin = User(
            email="admin@test.com",
            full_name="Test Admin",
            password_hash=get_password_hash("admin123"),
            role="admin",
            is_active=True,
            is_verified=True,
            wallet_balance=0,
            referral_code=f"ADMIN{datetime.utcnow().strftime('%Y%m%d')}",
            created_at=datetime.utcnow()
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Test admin user created successfully!")
        print(f"   Email: admin@test.com")
        print(f"   Password: admin123")
        print(f"   Role: {admin.role}")
        print(f"   ID: {admin.id}")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_admin()
