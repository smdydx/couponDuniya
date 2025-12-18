"""
Debug script to test merchant application endpoint directly
"""
import requests
import json

# Test endpoint
BASE_URL = "http://localhost:8000/api/v1"

def test_merchant_application():
    print("=" * 50)
    print("Testing Merchant Application Endpoint")
    print("=" * 50)
    
    # Sample application data
    application_data = {
        "business_name": "Test Business",
        "business_email": "test@business.com",
        "business_phone": "9876543210",
        "business_address": "123 Test Street",
        "business_city": "Mumbai",
        "business_state": "Maharashtra",
        "business_pincode": "400001",
        "gst_number": "",
        "pan_number": "",
        "website_url": "",
        "description": ""
    }
    
    # You need to replace this with an actual auth token
    # Get it from the browser's localStorage or by logging in
    auth_token = input("Enter your authentication token (from browser localStorage): ")
    
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    print("\nSending request to:", f"{BASE_URL}/merchants/apply")
    print("Data:", json.dumps(application_data, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/merchants/apply",
            json=application_data,
            headers=headers
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print("Response:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 400:
            print("\n⚠️  400 Bad Request Error Detected!")
            print("This usually means:")
            print("1. You already have a pending application")
            print("2. You are already a verified merchant")
            print("3. Validation error in the submitted data")
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Request failed: {e}")
    except json.JSONDecodeError:
        print(f"\n❌ Response is not valid JSON:")
        print(response.text)

if __name__ == "__main__":
    test_merchant_application()
