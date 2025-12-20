#!/usr/bin/env python3
"""
Script to test merchant application submission
"""
import sys
from pathlib import Path
import requests
import json

# Test data for merchant application
test_applications = [
    {
        "business_name": "Test Business 1",
        "business_email": "test1@example.com",
        "business_phone": "9876543210",
        "business_address": "123 Test Street",
        "business_city": "Mumbai",
        "business_state": "Maharashtra",
        "business_pincode": "400001",
        "gst_number": "22AAAAA0000A1Z5",
        "pan_number": "ABCDE1234F",
        "website_url": "https://test1.com",
        "description": "Test business description 1"
    },
    {
        "business_name": "Test Business 2",
        "business_email": "test2@example.com",
        "business_phone": "9876543211",
        "business_address": "456 Test Avenue",
        "business_city": "Delhi",
        "business_state": "Delhi",
        "business_pincode": "110001",
        "gst_number": "07BBBBB0000B1Z5",
        "pan_number": "FGHIJ5678K",
        "website_url": "https://test2.com",
        "description": "Test business description 2"
    }
]

def main():
    print("\n" + "="*80)
    print("MERCHANT APPLICATION TEST")
    print("="*80 + "\n")
    
    # You need to provide valid auth tokens for testing
    print("This script requires valid authentication tokens to test.")
    print("Please test manually by:")
    print("1. Creating 2 different user accounts")
    print("2. Logging in as User 1 and submitting a merchant application")
    print("3. Checking the admin panel - you should see 1 pending application")
    print("4. Logging in as User 2 and submitting another merchant application")
    print("5. Checking the admin panel - you should see 2 pending applications")
    print("\nIf you only see 1 application after step 5, there's a bug.")
    print("\nTest data you can use:")
    for i, app in enumerate(test_applications, 1):
        print(f"\nApplication {i}:")
        print(json.dumps(app, indent=2))

if __name__ == "__main__":
    main()
