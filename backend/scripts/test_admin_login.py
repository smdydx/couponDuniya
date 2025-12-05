
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests

API_URL = "http://localhost:8000/api/v1"

def test_admin_login():
    # Login as admin
    login_payload = {
        "email": "admin@test.com",
        "password": "admin123"
    }
    
    print("🔐 Attempting admin login...")
    response = requests.post(f"{API_URL}/auth/login", json=login_payload)
    
    if response.status_code == 200:
        data = response.json()
        access_token = data.get("access_token")
        user = data.get("user", {})
        
        print(f"✅ Login successful!")
        print(f"   User: {user.get('email')}")
        print(f"   Role: {user.get('role')}")
        print(f"   Is Admin: {user.get('is_admin')}")
        print(f"   Token: {access_token[:20]}...")
        
        # Test admin dashboard access
        print("\n📊 Testing admin dashboard access...")
        headers = {"Authorization": f"Bearer {access_token}"}
        dashboard_response = requests.get(f"{API_URL}/admin/analytics/dashboard", headers=headers)
        
        if dashboard_response.status_code == 200:
            print("✅ Admin dashboard accessible!")
            print(f"   Response: {dashboard_response.json()}")
        else:
            print(f"❌ Admin dashboard failed: {dashboard_response.status_code}")
            print(f"   Error: {dashboard_response.text}")
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Error: {response.text}")

if __name__ == "__main__":
    test_admin_login()
