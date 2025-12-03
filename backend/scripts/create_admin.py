
#!/usr/bin/env python3
"""
Script to create an admin user or promote existing user to admin
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models import User
from app.security import get_password_hash


def create_admin_user(email: str, password: str, full_name: str = "Admin User"):
    """Create a new admin user or promote existing user"""
    db = SessionLocal()
    
    try:
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"User with email {email} already exists.")
            user.is_admin = True
            user.role = "admin"
            user.is_active = True
            user.is_verified = True
            print(f"✅ Promoted {email} to admin")
        else:
            # Create new admin user
            user = User(
                email=email,
                password_hash=get_password_hash(password),
                full_name=full_name,
                is_admin=True,
                role="admin",
                is_active=True,
                is_verified=True,
                referral_code=f"ADMIN{email[:4].upper()}"
            )
            db.add(user)
            print(f"✅ Created new admin user: {email}")
        
        db.commit()
        db.refresh(user)
        
        print(f"\n{'='*50}")
        print(f"Admin User Details:")
        print(f"{'='*50}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")
        print(f"Is Admin: {user.is_admin}")
        print(f"Is Active: {user.is_active}")
        print(f"Is Verified: {user.is_verified}")
        print(f"{'='*50}\n")
        
        return user
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🔐 Admin User Creator\n")
    
    # Default admin credentials
    email = "admin@example.com"
    password = "Admin@123"
    full_name = "Admin User"
    
    create_admin_user(email, password, full_name)
    
    print("\n✅ You can now login with these credentials:")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print(f"\n🌐 Login at: http://0.0.0.0:5000/login")
    print(f"   Then navigate to: http://0.0.0.0:5000/admin/dashboard\n")
