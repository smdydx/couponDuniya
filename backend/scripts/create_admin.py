
"""
Script to create or update the admin user.
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.user import User
from app.security import get_password_hash

def create_admin():
    """Create or update admin user with verified status."""
    db: Session = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@couponali.com").first()
        
        if admin:
            # Update existing admin
            admin.hashed_password = get_password_hash("admin123")
            admin.is_admin = True
            admin.is_verified = True  # CRITICAL: Ensure admin is verified
            admin.is_active = True
            admin.role = "admin"
            print("✅ Updated existing admin user")
        else:
            # Create new admin
            admin = User(
                email="admin@couponali.com",
                hashed_password=get_password_hash("admin123"),
                name="Admin User",
                is_admin=True,
                is_verified=True,  # CRITICAL: Mark as verified
                is_active=True,
                role="admin"
            )
            db.add(admin)
            print("✅ Created new admin user")
        
        db.commit()
        db.refresh(admin)
        
        # Verify the settings
        print("\n" + "="*50)
        print("ADMIN ACCOUNT DETAILS:")
        print("="*50)
        print(f"Email:        admin@couponali.com")
        print(f"Password:     admin123")
        print(f"ID:           {admin.id}")
        print(f"Is Admin:     {admin.is_admin}")
        print(f"Is Verified:  {admin.is_verified}")
        print(f"Is Active:    {admin.is_active}")
        print(f"Role:         {admin.role}")
        print("="*50)
        
        if not admin.is_verified:
            print("\n⚠️  WARNING: Admin account is NOT verified!")
            print("Run this script again to fix it.")
            return False
        
        print("\n✅ Admin account is ready to use!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error creating admin: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = create_admin()
    sys.exit(0 if success else 1)
