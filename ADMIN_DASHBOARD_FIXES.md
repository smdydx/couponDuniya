# Admin Dashboard Issues & Fixes

## Issues Identified

### 1. **Image Upload/Change Not Reflecting**
- **Problem**: When images are uploaded/changed in admin panel, they don't reflect on the homepage
- **Root Cause**: Cache invalidation not working properly after image updates
- **Location**: Backend cache management in `/backend/app/api/v1/merchants.py` and `/backend/app/api/v1/offers.py`

### 2. **Merchant CRUD Operations**
- **Problem**: Changes to merchants not reflecting immediately
- **Root Cause**: Redis cache not being invalidated properly
- **Location**: `/backend/app/redis_client.py` and merchant API endpoints

### 3. **Pending Seller Applications Not Showing**
- **Problem**: Dashboard shows 0 pending applications even when users apply
- **Root Cause**: API endpoint returns data but frontend may not be parsing it correctly
- **Location**: `/frontend/src/app/admin/dashboard/page.tsx` line 93-95

### 4. **KYC/Verification Flow**
- **Problem**: Verification status not updating properly
- **Root Cause**: User model and Merchant model verification status not syncing
- **Location**: `/backend/app/api/v1/merchants.py` lines 413-472

## Fixes Required

### Fix 1: Cache Invalidation for Images

**File**: `/backend/app/api/v1/merchants.py`

Add proper cache invalidation after merchant updates:

```python
@router.put("/{merchant_id}")
def update_merchant(
    merchant_id: int,
    merchant_data: dict,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Update an existing merchant"""
    merchant = db.get(Merchant, merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    # Check if slug is being changed
    if "slug" in merchant_data and merchant_data["slug"] != merchant.slug:
        if db.scalar(select(Merchant).where(Merchant.slug == merchant_data["slug"])):
            raise HTTPException(status_code=400, detail="Merchant slug already exists")

    for key, value in merchant_data.items():
        setattr(merchant, key, value)

    db.commit()
    db.refresh(merchant)

    # ENHANCED CACHE INVALIDATION
    cache_invalidate(rk("cache", "merchant", merchant.slug))
    cache_invalidate_prefix(rk("cache", "merchants"))
    cache_invalidate(rk("cache", "merchants", "featured"))
    cache_invalidate_prefix(rk("cache", "homepage"))  # ADD THIS LINE
    
    return {"success": True, "data": merchant}
```

### Fix 2: Dashboard Pending Applications API Call

**File**: `/frontend/src/app/admin/dashboard/page.tsx`

Fix the API call on line 93:

```typescript
// BEFORE (line 93-95):
fetch(`${process.env.NEXT_PUBLIC_API_URL || '/backend-api'}/api/v1/merchants/admin/pending-applications?limit=1`, {
  headers: { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' }
}).then(r => r.json()).then(data => ({ data })),

// AFTER:
adminApiClient.get("/merchants/admin/pending-applications", { 
  params: { limit: 100, status: 'pending' } 
}),
```

### Fix 3: Add Refresh Button to Dashboard

**File**: `/frontend/src/app/admin/dashboard/page.tsx`

Add a refresh button near line 300:

```typescript
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
      Admin Dashboard
    </h1>
    <p className="text-gray-500">
      Welcome back! Here&apos;s your platform overview for today
    </p>
  </div>
  <Button 
    variant="outline" 
    onClick={() => {
      fetchDashboardData();
      toast.success("Dashboard refreshed");
    }}
    className="gap-2"
  >
    <RefreshCw className="h-4 w-4" />
    Refresh Data
  </Button>
</div>
```

### Fix 4: Image Upload Component Force Refresh

**File**: `/frontend/src/components/admin/ImageUploader.tsx` (if exists)

Add cache-busting parameter to uploaded images:

```typescript
const handleUploadSuccess = (url: string) => {
  // Add timestamp to force browser to reload image
  const urlWithCacheBust = `${url}?t=${Date.now()}`;
  onChange(urlWithCacheBust);
};
```

### Fix 5: Homepage Cache TTL Reduction

**File**: `/backend/app/api/v1/homepage.py`

Reduce cache time from 2 minutes to 30 seconds for faster updates:

```python
# Line 162 - CHANGE FROM:
cache_set(cache_key, result, ttl=120)

# TO:
cache_set(cache_key, result, ttl=30)
```

### Fix 6: Add Cache Clear Endpoint

**File**: `/backend/app/api/v1/admin.py` (create if doesn't exist)

```python
from fastapi import APIRouter, Depends
from ...dependencies import require_admin
from ...redis_client import redis_client
from ...models import User

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/clear-cache")
def clear_all_cache(
    admin_user: User = Depends(require_admin)
):
    """Clear all Redis cache - admin only"""
    try:
        redis_client.flushdb()
        return {
            "success": True,
            "message": "All cache cleared successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to clear cache: {str(e)}"
        }
```

## Testing Steps

1. **Test Image Upload**:
   - Upload/change merchant logo in admin panel
   - Wait 30 seconds
   - Refresh homepage
   - Verify new image appears

2. **Test Pending Applications**:
   - Create a new user account
   - Apply as merchant from user dashboard
   - Check admin dashboard
   - Verify application appears in "Verification Requests" tab

3. **Test Verification Flow**:
   - Approve a pending merchant application
   - Verify merchant appears in merchants list
   - Verify user role changes to "merchant"
   - Check user can access merchant dashboard

4. **Test Cache Refresh**:
   - Make changes in admin panel
   - Click refresh button on dashboard
   - Verify changes reflect immediately

## Priority Order

1. **HIGH**: Fix cache invalidation (Fix 1 & 5)
2. **HIGH**: Fix pending applications display (Fix 2)
3. **MEDIUM**: Add refresh functionality (Fix 3)
4. **MEDIUM**: Image cache busting (Fix 4)
5. **LOW**: Cache clear endpoint (Fix 6)

## Additional Notes

- All changes should be tested in development before deploying
- Consider adding error notifications for failed operations
- Add loading states for all async operations
- Implement optimistic UI updates where possible
