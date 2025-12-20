# Merchant Application Debugging Guide

## Issue Description
When a new user submits a "become seller" application, previous pending applications seem to disappear or get replaced in the admin panel.

## Changes Made

### 1. Enhanced `get_pending_merchant_applications` Endpoint
**File**: `backend/app/api/v1/merchants.py`

**Changes**:
- Added detailed logging to track how many applications are being fetched
- Explicitly built the response data instead of relying on `to_dict()` methods
- Ensured all user and merchant fields are included in the response
- Added logging for each application being added to the response

**Purpose**: This ensures that the backend is returning complete data for ALL pending applications, not just the most recent one.

### 2. Enhanced `apply_as_merchant` Endpoint Logging
**File**: `backend/app/api/v1/merchants.py`

**Changes**:
- Added logging to track existing merchant records for the current user
- Added logging when deleting old pending applications
- Added logging when keeping approved merchants
- Added logging after resetting user merchant state

**Purpose**: This helps us understand if the cleanup logic is accidentally affecting other users' applications.

## How to Test

### Step 1: Check Current State
```bash
cd backend
source venv/bin/activate
python check_merchants.py
```

This will show you all current merchant applications in the database.

### Step 2: Create Test Users and Submit Applications

1. **Create User 1**:
   - Register a new user account (e.g., `testuser1@example.com`)
   - Login as this user
   - Go to "Become Seller" page
   - Fill out the form with test data:
     - Business Name: Test Business 1
     - Email: test1@business.com
     - Phone: 9876543210
     - Address: 123 Test Street
     - City: Mumbai
     - State: Maharashtra
     - Pincode: 400001
   - Submit the application

2. **Check Admin Panel**:
   - Login as admin
   - Go to Merchants → Verification Requests
   - You should see 1 pending application

3. **Create User 2**:
   - Logout and register another new user (e.g., `testuser2@example.com`)
   - Login as this user
   - Go to "Become Seller" page
   - Fill out the form with different test data:
     - Business Name: Test Business 2
     - Email: test2@business.com
     - Phone: 9876543211
     - Address: 456 Test Avenue
     - City: Delhi
     - State: Delhi
     - Pincode: 110001
   - Submit the application

4. **Check Admin Panel Again**:
   - Go back to admin panel
   - Go to Merchants → Verification Requests
   - **EXPECTED**: You should see 2 pending applications
   - **IF BUG EXISTS**: You will only see 1 application (the most recent one)

### Step 3: Check Backend Logs

After submitting applications, check the backend logs to see what's happening:

```bash
# The backend should be running with: uvicorn app.main:app --reload
# Check the terminal where it's running for log messages like:

# When User 1 submits:
INFO: Merchant application received from user 1
INFO: Found 0 existing merchant records for user 1
INFO: Reset merchant state for user 1
INFO: Merchant application created successfully: merchant_id=X, user_id=1

# When User 2 submits:
INFO: Merchant application received from user 2
INFO: Found 0 existing merchant records for user 2
INFO: Reset merchant state for user 2
INFO: Merchant application created successfully: merchant_id=Y, user_id=2

# When admin fetches pending applications:
INFO: Fetching pending applications: status=pending, page=1, total=2, found=2
INFO: Added application: id=X, business=Test Business 1, user=testuser1@example.com
INFO: Added application: id=Y, business=Test Business 2, user=testuser2@example.com
INFO: Returning 2 applications out of 2 total
```

### Step 4: Check Database Directly

```bash
cd backend
source venv/bin/activate
python check_merchants.py
```

This will show you exactly what's in the database.

## Expected Behavior

1. **Backend**: Should create separate merchant records for each user
2. **Database**: Should have 2 rows in the `merchants` table with `verification_status = 'pending'`
3. **API Response**: Should return both applications in the response
4. **Frontend**: Should display both applications in the admin panel

## Possible Root Causes

If the issue persists after these changes:

1. **Frontend State Issue**: The frontend might be replacing the applications array instead of updating it
2. **Caching Issue**: There might be caching on the frontend or backend
3. **Race Condition**: If applications are submitted very quickly, there might be a race condition
4. **Database Transaction Issue**: Though unlikely, there could be a transaction isolation issue

## Next Steps

1. **Test with the changes above**
2. **Check the backend logs** to see if both applications are being created
3. **Check the database** to confirm both records exist
4. **Check the API response** using browser DevTools Network tab to see what data is being returned
5. **Check the frontend** to see if it's properly handling the response

## Additional Debugging

If you want to see the exact API response, you can:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the admin merchants page
4. Look for the request to `/api/v1/merchants/admin/pending-applications`
5. Check the Response tab to see the exact JSON being returned

The response should look like:
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": 1,
        "business_name": "Test Business 1",
        "user": {
          "email": "testuser1@example.com"
        },
        ...
      },
      {
        "id": 2,
        "business_name": "Test Business 2",
        "user": {
          "email": "testuser2@example.com"
        },
        ...
      }
    ],
    "pagination": {
      "total_items": 2,
      ...
    }
  }
}
```

If you only see 1 application in the response, then the issue is in the backend.
If you see 2 applications in the response but only 1 in the UI, then the issue is in the frontend.
