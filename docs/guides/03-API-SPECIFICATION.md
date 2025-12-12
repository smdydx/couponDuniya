# API Specification - FastAPI (Elesiya) Backend

## 🚀 API Overview

**Base URL**: `https://api.yourcoupondomain.com/v1`
**Authentication**: JWT Bearer Token
**Response Format**: JSON

---

## 🔐 Authentication Endpoints

### `POST /auth/register`
Register new user with email/mobile

**Request Body**:
```json
{
  "email": "user@example.com",
  "mobile": "+919876543210",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "referral_code": "ABC123XYZ" // optional
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully. Please verify your email/mobile.",
  "data": {
    "user_id": 123,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "mobile": "+919876543210",
    "referral_code": "USER123"
  }
}
```

---

### `POST /auth/login`
Login with email/mobile + password

**Request Body**:
```json
{
  "identifier": "user@example.com", // email or mobile
  "password": "SecurePass123!"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "dGhpc2lz...",
    "expires_in": 3600,
    "user": {
      "id": 123,
      "email": "user@example.com",
      "full_name": "John Doe",
      "wallet_balance": 1250.50,
      "pending_cashback": 340.00
    }
  }
}
```

---

### `POST /auth/request-otp`
Request OTP for mobile login/verification

**Request Body**:
```json
{
  "mobile": "+919876543210",
  "purpose": "login" // or "verification"
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp_id": "otp_abc123",
    "expires_in": 300
  }
}
```

---

### `POST /auth/verify-otp`
Verify OTP and login

**Request Body**:
```json
{
  "mobile": "+919876543210",
  "otp": "123456",
  "otp_id": "otp_abc123"
}
```

**Response**: Similar to `/auth/login`

---

### `POST /auth/social-login`
Google/Facebook OAuth login

**Request Body**:
```json
{
  "provider": "google", // or "facebook"
  "access_token": "ya29.a0AfH6..."
}
```

**Response**: Similar to `/auth/login`

---

### `POST /auth/refresh-token`
Get new access token using refresh token

**Request Body**:
```json
{
  "refresh_token": "dGhpc2lz..."
}
```

---

### `POST /auth/logout`
Revoke current session

**Headers**: `Authorization: Bearer <token>`

---

## 👤 User Endpoints

### `GET /users/me`
Get current user profile

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 123,
    "email": "user@example.com",
    "mobile": "+919876543210",
    "full_name": "John Doe",
    "avatar_url": "https://cdn.example.com/avatar.jpg",
    "wallet_balance": 1250.50,
    "pending_cashback": 340.00,
    "lifetime_earnings": 5600.75,
    "referral_code": "USER123",
    "is_verified": true,
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### `PATCH /users/me`
Update profile

**Request Body** (all fields optional):
```json
{
  "full_name": "John M. Doe",
  "date_of_birth": "1995-05-15",
  "gender": "male",
  "avatar_url": "https://..."
}
```

---

### `GET /users/me/kyc`
Get KYC details

---

### `POST /users/me/kyc`
Submit KYC information

**Request Body**:
```json
{
  "account_holder_name": "John Doe",
  "account_number": "1234567890",
  "ifsc_code": "SBIN0001234",
  "bank_name": "State Bank of India",
  "upi_id": "john@paytm",
  "pan_number": "ABCDE1234F",
  "address_line1": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

---

## 🏪 Merchant Endpoints

### `GET /merchants`
List all merchants

**Query Params**:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `category_id` (optional)
- `is_featured` (boolean)
- `search` (name search)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "merchants": [
      {
        "id": 1,
        "uuid": "...",
        "name": "Amazon India",
        "slug": "amazon",
        "logo_url": "https://...",
        "default_cashback_type": "percentage",
        "default_cashback_value": 5.2,
        "offers_count": 23,
        "is_featured": true
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 10,
      "total_items": 200,
      "per_page": 20
    }
  }
}
```

---

### `GET /merchants/{slug}`
Get merchant details

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Amazon India",
    "slug": "amazon",
    "description": "Shop online at Amazon...",
    "logo_url": "https://...",
    "banner_url": "https://...",
    "website_url": "https://amazon.in",
    "default_cashback_type": "percentage",
    "default_cashback_value": 5.2,
    "categories": ["Electronics", "Fashion", "Books"],
    "seo_title": "Amazon Coupons & Cashback",
    "seo_description": "...",
    "active_offers_count": 23
  }
}
```

---

## 🎫 Offer Endpoints

### `GET /offers`
List offers with filters

**Query Params**:
- `page`, `limit`
- `merchant_id`
- `category_id`
- `offer_type` (code, deal, sale)
- `is_exclusive` (boolean)
- `is_featured` (boolean)
- `sort` (latest, popular, cashback_high, expiring_soon)
- `search`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "offers": [
      {
        "id": 100,
        "uuid": "...",
        "title": "60% Off on Fashion",
        "description": "Shop trendy fashion...",
        "offer_type": "code",
        "coupon_code": "FASHION60",
        "cashback_type": "percentage",
        "cashback_value": 7.0,
        "max_cashback": 500.00,
        "merchant": {
          "id": 2,
          "name": "Flipkart",
          "slug": "flipkart",
          "logo_url": "https://..."
        },
        "category": {
          "id": 5,
          "name": "Fashion",
          "slug": "fashion"
        },
        "is_exclusive": false,
        "is_verified": true,
        "expires_at": "2025-12-31T23:59:59Z",
        "views_count": 1234,
        "clicks_count": 567
      }
    ],
    "pagination": {...}
  }
}
```

---

### `GET /offers/{uuid}`
Get offer details

---

### `POST /offers/{uuid}/click`
Track offer click and get redirect URL

**Headers**: `Authorization: Bearer <token>` (optional, for logged-in tracking)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "click_id": "550e8400-...",
    "redirect_url": "https://track.example.com/...",
    "coupon_code": "FASHION60", // if offer_type = 'code'
    "message": "Click tracked. Cashback will be credited after purchase confirmation."
  }
}
```

---

### `POST /offers/{uuid}/view`
Track offer impression

---

## 📦 Product Endpoints (Gift Cards)

### `GET /products`
List gift card products

**Query Params**:
- `page`, `limit`
- `category_id`
- `merchant_id`
- `is_featured`, `is_bestseller`
- `min_price`, `max_price`
- `search`
- `sort` (latest, popular, price_low, price_high)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "uuid": "...",
        "name": "Flipkart E-Gift Voucher",
        "slug": "flipkart-egift-voucher",
        "sku": "EGVGBFLSCLPS001",
        "description": "...",
        "image_url": "https://...",
        "category": {
          "id": 1,
          "name": "E-Commerce/Online"
        },
        "merchant": {
          "id": 2,
          "name": "Flipkart",
          "logo_url": "https://..."
        },
        "variants": [
          {
            "id": 1,
            "denomination": 100.00,
            "selling_price": 100.00,
            "is_available": true
          },
          {
            "id": 2,
            "denomination": 500.00,
            "selling_price": 500.00,
            "is_available": true
          }
        ],
        "card_type": "e-gift",
        "delivery_method": "email",
        "validity_days": 365,
        "is_in_stock": true,
        "is_featured": false,
        "sales_count": 456
      }
    ],
    "pagination": {...}
  }
}
```

---

### `GET /products/{slug}`
Get product details with variants

---

## 🛒 Cart Endpoints

**Note**: Cart is maintained client-side. Backend validates on checkout.

### `POST /cart/validate`
Validate cart before checkout

**Request Body**:
```json
{
  "items": [
    {
      "variant_id": 1,
      "quantity": 2
    },
    {
      "variant_id": 5,
      "quantity": 1
    }
  ],
  "promo_code": "WELCOME10" // optional
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "variant_id": 1,
        "product_name": "Flipkart E-Gift Voucher",
        "denomination": 100.00,
        "quantity": 2,
        "unit_price": 100.00,
        "total_price": 200.00,
        "is_available": true
      }
    ],
    "subtotal": 700.00,
    "discount": 70.00, // from promo code
    "tax": 0.00,
    "total": 630.00,
    "promo_applied": {
      "code": "WELCOME10",
      "discount_type": "percentage",
      "discount_value": 10
    }
  }
}
```

---

## 💳 Checkout & Order Endpoints

### `POST /checkout/create-order`
Create order and initiate payment

**Request Body**:
```json
{
  "items": [...], // same as cart/validate
  "promo_code": "WELCOME10",
  "use_wallet_balance": true,
  "wallet_amount": 100.00, // amount to deduct from wallet
  "delivery_email": "user@example.com",
  "delivery_mobile": "+919876543210"
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "order_id": 123,
    "order_number": "ORD-2025-001234",
    "uuid": "...",
    "total_amount": 530.00, // after wallet deduction
    "payment_required": true,
    "payment_details": {
      "gateway": "razorpay",
      "order_id": "order_Nkd...",
      "amount": 53000, // in paisa
      "currency": "INR",
      "key": "rzp_live_..."
    }
  }
}
```

---

### `POST /checkout/payment-webhook`
Razorpay webhook handler (called by payment gateway)

**Headers**: `X-Razorpay-Signature`

**Request Body**: Razorpay webhook payload

---

### `POST /checkout/verify-payment`
Verify payment after Razorpay callback

**Request Body**:
```json
{
  "order_id": 123,
  "razorpay_order_id": "order_Nkd...",
  "razorpay_payment_id": "pay_Nkd...",
  "razorpay_signature": "abc..."
}
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "payment_verified": true,
    "order_status": "paid",
    "message": "Payment successful! Order processing started."
  }
}
```

---

### `GET /orders`
List user's orders

**Query Params**:
- `page`, `limit`
- `status` (pending, paid, fulfilled, cancelled, refunded)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 123,
        "order_number": "ORD-2025-001234",
        "uuid": "...",
        "total_amount": 630.00,
        "status": "fulfilled",
        "payment_status": "completed",
        "fulfillment_status": "delivered",
        "items_count": 3,
        "created_at": "2025-11-24T10:00:00Z",
        "completed_at": "2025-11-24T10:05:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### `GET /orders/{order_number}`
Get order details

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "ORD-2025-001234",
    "status": "fulfilled",
    "items": [
      {
        "id": 1,
        "product_name": "Flipkart E-Gift Voucher",
        "product_sku": "EGVGBFLSCLPS001",
        "denomination": 100.00,
        "quantity": 2,
        "unit_price": 100.00,
        "total_price": 200.00,
        "voucher_codes": [
          {
            "code": "ABC123XYZ456",
            "pin": "7890",
            "expiry": "2026-11-24",
            "status": "active"
          },
          {
            "code": "DEF789GHI012",
            "pin": "3456",
            "expiry": "2026-11-24",
            "status": "active"
          }
        ],
        "fulfillment_status": "delivered",
        "delivered_at": "2025-11-24T10:05:00Z"
      }
    ],
    "subtotal": 700.00,
    "discount_amount": 70.00,
    "wallet_used": 100.00,
    "total_amount": 530.00,
    "payment": {
      "method": "razorpay",
      "status": "success",
      "paid_at": "2025-11-24T10:02:00Z"
    },
    "created_at": "2025-11-24T10:00:00Z",
    "completed_at": "2025-11-24T10:05:00Z"
  }
}
```

---

## 💰 Wallet Endpoints

### `GET /wallet`
Get wallet balance and summary

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "balance": 1250.50,
    "pending_cashback": 340.00,
    "lifetime_earnings": 5600.75,
    "total_withdrawn": 4010.25
  }
}
```

---

### `GET /wallet/transactions`
List wallet transactions

**Query Params**:
- `page`, `limit`
- `type` (cashback_earned, order_payment, withdrawal, etc.)
- `from_date`, `to_date`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 456,
        "uuid": "...",
        "amount": 50.00,
        "type": "cashback_earned",
        "description": "Cashback from Amazon purchase",
        "balance_after": 1250.50,
        "created_at": "2025-11-23T15:30:00Z"
      },
      {
        "id": 455,
        "amount": -100.00,
        "type": "order_payment",
        "description": "Payment for Order ORD-2025-001234",
        "balance_after": 1200.50,
        "created_at": "2025-11-24T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### `GET /wallet/cashback-events`
List cashback tracking events

**Query Params**:
- `status` (pending, confirmed, rejected, reversed)

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "cashback_events": [
      {
        "id": 789,
        "merchant": {
          "name": "Amazon India",
          "logo_url": "https://..."
        },
        "offer": {
          "title": "60% Off Electronics"
        },
        "transaction_amount": 5000.00,
        "cashback_amount": 260.00,
        "status": "pending",
        "created_at": "2025-11-20T12:00:00Z",
        "estimated_confirmation": "2025-12-20T12:00:00Z"
      },
      {
        "id": 788,
        "merchant": {
          "name": "Flipkart",
          "logo_url": "https://..."
        },
        "cashback_amount": 50.00,
        "status": "confirmed",
        "confirmed_at": "2025-11-15T10:00:00Z",
        "paid_at": "2025-11-15T10:01:00Z"
      }
    ],
    "summary": {
      "total_pending": 600.00,
      "total_confirmed": 4850.75,
      "total_rejected": 150.00
    },
    "pagination": {...}
  }
}
```

---

### `POST /wallet/claim-missing-cashback`
Claim cashback that wasn't tracked

**Request Body**:
```json
{
  "merchant_id": 1,
  "offer_id": 100,
  "transaction_amount": 5000.00,
  "transaction_date": "2025-11-20",
  "order_id": "Amazon-12345",
  "screenshot_url": "https://...", // optional proof
  "notes": "Clicked through the offer but cashback not tracked"
}
```

---

### `POST /wallet/withdraw`
Request withdrawal

**Request Body**:
```json
{
  "amount": 500.00,
  "method": "upi", // or 'bank', 'gift_voucher', 'mobile_recharge'
  "destination_details": {
    "upi_id": "john@paytm"
    // or bank details, recharge number, etc.
  }
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "withdrawal_id": 45,
    "uuid": "...",
    "amount": 500.00,
    "method": "upi",
    "status": "pending",
    "estimated_processing_time": "24-48 hours",
    "created_at": "2025-11-24T14:00:00Z"
  }
}
```

---

### `GET /wallet/withdrawals`
List withdrawal requests

---

## 👥 Referral Endpoints

### `GET /referrals/my-code`
Get user's referral code and stats

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "referral_code": "USER123",
    "referral_link": "https://yourcoupondomain.com/signup?ref=USER123",
    "total_referrals": 15,
    "active_referrals": 12,
    "total_earned": 1250.00,
    "pending_earnings": 340.00
  }
}
```

---

### `GET /referrals/my-referrals`
List users referred by current user

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "referrals": [
      {
        "id": 10,
        "referred_user": {
          "full_name": "Jane Doe",
          "joined_at": "2025-10-15T10:00:00Z"
        },
        "status": "active",
        "total_earned": 450.00,
        "activated_at": "2025-10-16T12:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

## 📊 Category Endpoints

### `GET /categories`
List categories

**Query Params**:
- `type` (offer, product, both)
- `is_featured`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Fashion",
        "slug": "fashion",
        "icon_url": "https://...",
        "type": "both",
        "offers_count": 234,
        "products_count": 12,
        "is_featured": true
      }
    ]
  }
}
```

---

## 🔍 Search Endpoint

### `GET /search`
Global search across merchants, offers, products

**Query Params**:
- `q` (query string)
- `type` (merchant, offer, product, all)
- `limit`

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "merchants": [...],
    "offers": [...],
    "products": [...],
    "total_results": 45
  }
}
```

---

## 📄 CMS Endpoints

### `GET /cms/pages/{slug}`
Get static page content

**Example**: `/cms/pages/terms-and-conditions`

---

## 🛠️ Admin Endpoints (Requires Admin Role)

### Merchants
- `POST /admin/merchants` - Create merchant
- `PUT /admin/merchants/{id}` - Update merchant
- `DELETE /admin/merchants/{id}` - Soft delete merchant

### Offers
- `POST /admin/offers` - Create offer
- `PUT /admin/offers/{id}` - Update offer
- `DELETE /admin/offers/{id}` - Delete offer

### Products
- `POST /admin/products` - Create product
- `PUT /admin/products/{id}` - Update product
- `POST /admin/products/{id}/variants` - Add variants

### Orders
- `GET /admin/orders` - List all orders with filters
- `PATCH /admin/orders/{id}/status` - Update order status
- `POST /admin/orders/{id}/fulfill` - Mark as fulfilled, send vouchers

### Cashback
- `GET /admin/cashback` - List all cashback events
- `PATCH /admin/cashback/{id}/confirm` - Confirm cashback
- `PATCH /admin/cashback/{id}/reject` - Reject cashback

### Withdrawals
- `GET /admin/withdrawals` - List all withdrawal requests
- `PATCH /admin/withdrawals/{id}/approve` - Approve withdrawal
- `PATCH /admin/withdrawals/{id}/complete` - Mark as completed
- `PATCH /admin/withdrawals/{id}/reject` - Reject withdrawal

### Analytics
- `GET /admin/analytics/dashboard` - Overview stats
- `GET /admin/analytics/revenue` - Revenue charts
- `GET /admin/analytics/top-merchants` - Performance data

---

## 📡 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["Invalid email format"],
      "mobile": ["Mobile number already exists"]
    }
  }
}
```

**Common Error Codes**:
- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `RATE_LIMIT_EXCEEDED` (429)
- `INTERNAL_SERVER_ERROR` (500)

---

**Next Document**: `04-FRONTEND-ARCHITECTURE.md` - React/Next.js structure
