
# Admin Gift Card Management Flow

## Overview
This document explains how gift cards flow through the system from admin creation to user display.

## Complete Data Flow

```
┌─────────────┐
│   Admin     │
│  Dashboard  │
└──────┬──────┘
       │
       │ 1. Creates/Manages Gift Cards
       ▼
┌─────────────────────────────┐
│  Admin API Endpoints        │
│  /api/v1/admin/gift-cards   │
└──────────┬──────────────────┘
           │
           │ 2. Stores in Database
           ▼
┌──────────────────────┐
│   gift_cards table   │
│   products table     │
│   product_variants   │
└──────────┬───────────┘
           │
           │ 3. Frontend fetches via API
           ▼
┌────────────────────────┐
│  Homepage API          │
│  /api/v1/homepage/     │
└──────────┬─────────────┘
           │
           │ 4. Returns real data (cached)
           ▼
┌──────────────────────┐
│  Frontend Display    │
│  Featured Products   │
└──────────────────────┘
```

## Admin Endpoints (All require admin authentication)

### 1. List All Gift Cards
```
GET /api/v1/admin/gift-cards?page=1&limit=50&search=ABC&status=active
```

**Filters:**
- `search`: Search by code
- `status`: active, used, expired, inactive

**Response:**
```json
{
  "success": true,
  "data": {
    "gift_cards": [...],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 234,
      "per_page": 50
    }
  }
}
```

### 2. Bulk Create Gift Cards
```
POST /api/v1/admin/gift-cards/bulk-create
{
  "count": 100,
  "value": 500.0,
  "expires_in_days": 365
}
```

**Response:**
```json
{
  "success": true,
  "message": "Created 100 gift cards successfully",
  "data": {
    "created_count": 100,
    "gift_cards": [...]
  }
}
```

### 3. Update Gift Card
```
PATCH /api/v1/admin/gift-cards/{id}
{
  "is_active": true,
  "remaining_value": 450.0,
  "expires_at": "2025-12-31T23:59:59"
}
```

### 4. Delete (Deactivate) Gift Card
```
DELETE /api/v1/admin/gift-cards/{id}
```

### 5. Get Statistics
```
GET /api/v1/admin/gift-cards/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_cards": 1500,
    "active_cards": 1200,
    "assigned_cards": 800,
    "total_value": 750000.0,
    "redeemed_value": 320000.0,
    "available_value": 430000.0
  }
}
```

## Product Management (Gift Card Products for Sale)

Gift cards shown on homepage come from **Products** table, not GiftCard table.

### Creating Gift Card Products
```
POST /api/v1/admin/products
{
  "merchant_id": 1,
  "name": "Amazon Gift Card",
  "slug": "amazon-gift-card",
  "image_url": "/images/gift-cards/amazon.jpg",
  "is_featured": true,
  "is_bestseller": true,
  "is_active": true
}
```

### Adding Variants (Denominations)
```
POST /api/v1/admin/products/{product_id}/variants
{
  "denomination": 500,
  "selling_price": 475,
  "stock": 100,
  "is_available": true
}
```

## Frontend Integration

The homepage fetches products via:
```
GET /api/v1/homepage/?limit_products=8
```

This returns products with `is_featured=true` or `is_bestseller=true`.

## Cache Management

- Homepage data cached for 5 minutes
- Admin changes invalidate cache using: `cache_invalidate_prefix("gift-cards")`
- Redis key pattern: `cache:homepage:m12_fo8_eo6_p8`

## Database Tables Relationship

```
products (gift card products for sale)
├── id, name, slug, image_url
├── merchant_id → merchants.id
├── is_featured, is_bestseller
└── product_variants
    ├── denomination (₹100, ₹500, ₹1000)
    ├── selling_price
    ├── stock
    └── is_available

gift_cards (actual redeemable codes)
├── code (unique)
├── initial_value
├── remaining_value
├── user_id → users.id (assigned user)
├── expires_at
└── is_active
```

## Recommended Admin Workflow

1. **Create Merchant** (if not exists)
   - POST /api/v1/admin/merchants

2. **Create Product** (Gift Card Product)
   - POST /api/v1/admin/products
   - Set `is_featured=true` to show on homepage

3. **Add Variants** (Denominations)
   - POST /api/v1/admin/products/{id}/variants
   - Add ₹100, ₹500, ₹1000 variants

4. **Generate Redeemable Codes** (when order placed)
   - POST /api/v1/admin/gift-cards/bulk-create
   - Generate codes for order fulfillment

5. **Assign to User** (deliver code)
   - POST /api/v1/gift-cards/{id}/assign-deliver

## Testing the Flow

1. Create test merchant:
```bash
curl -X POST http://localhost:8000/api/v1/admin/merchants \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Amazon","slug":"amazon","is_active":true}'
```

2. Create product:
```bash
curl -X POST http://localhost:8000/api/v1/admin/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"merchant_id":1,"name":"Amazon Gift Card","slug":"amazon-gc","is_featured":true}'
```

3. Check homepage:
```bash
curl http://localhost:8000/api/v1/homepage/
```
