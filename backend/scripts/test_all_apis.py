"""Test all backend APIs"""
import requests
import json

BASE = "http://127.0.0.1:8000/api/v1"

def test_endpoint(method, path, data=None, auth=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if auth:
        headers["Authorization"] = f"Bearer {auth}"
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            r = requests.post(url, json=data or {}, headers=headers, timeout=5)
        else:
            r = requests.request(method, url, json=data, headers=headers, timeout=5)
        
        status = r.status_code
        if status < 400:
            return f"✅ {status}"
        elif status == 401:
            return f"🔒 {status} (auth required)"
        elif status == 404:
            return f"⚠️ {status} (not found)"
        elif status == 422:
            return f"⚠️ {status} (validation)"
        else:
            return f"❌ {status}"
    except Exception as e:
        return f"❌ Error: {str(e)[:30]}"

print("=" * 60)
print("TESTING ALL BACKEND APIs")
print("=" * 60)

# Health
print("\n🏥 HEALTH:")
print(f"  GET /health: {test_endpoint('GET', '/health')}")
print(f"  GET /health/live: {test_endpoint('GET', '/health/live')}")
print(f"  GET /health/ready: {test_endpoint('GET', '/health/ready')}")

# Categories
print("\n📁 CATEGORIES:")
print(f"  GET /categories/: {test_endpoint('GET', '/categories/')}")
print(f"  GET /categories/?is_active=true: {test_endpoint('GET', '/categories/?is_active=true')}")

# Merchants
print("\n🏪 MERCHANTS:")
print(f"  GET /merchants/: {test_endpoint('GET', '/merchants/')}")
print(f"  GET /merchants/featured: {test_endpoint('GET', '/merchants/featured')}")

# Offers
print("\n🎁 OFFERS:")
print(f"  GET /offers/: {test_endpoint('GET', '/offers/')}")
print(f"  GET /offers/featured: {test_endpoint('GET', '/offers/featured')}")

# Gift Cards
print("\n🎴 GIFT CARDS:")
print(f"  GET /gift-cards/: {test_endpoint('GET', '/gift-cards/')}")

# Homepage
print("\n🏠 HOMEPAGE:")
print(f"  GET /homepage/: {test_endpoint('GET', '/homepage/')}")
print(f"  GET /homepage/banners: {test_endpoint('GET', '/homepage/banners')}")

# Auth (no auth required for these)
print("\n🔐 AUTH (public):")
print(f"  POST /auth/register: {test_endpoint('POST', '/auth/register', {'email': 'test@test.com', 'password': 'Test@123'})}")
print(f"  POST /auth/login: {test_endpoint('POST', '/auth/login', {'email': 'test@test.com', 'password': 'Test@123'})}")

# Wallet (auth required)
print("\n💰 WALLET (auth required):")
print(f"  GET /wallet/balance: {test_endpoint('GET', '/wallet/balance')}")
print(f"  GET /wallet/transactions: {test_endpoint('GET', '/wallet/transactions')}")

# Referrals
print("\n👥 REFERRALS:")
print(f"  GET /referrals/: {test_endpoint('GET', '/referrals/')}")

# Newsletter
print("\n📰 NEWSLETTER:")
print(f"  POST /newsletter/subscribe: {test_endpoint('POST', '/newsletter/subscribe', {'email': 'test@test.com'})}")

# Admin (auth required)
print("\n👑 ADMIN (auth required):")
print(f"  GET /admin/stats: {test_endpoint('GET', '/admin/stats')}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
