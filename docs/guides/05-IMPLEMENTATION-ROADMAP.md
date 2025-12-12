# Implementation Roadmap - Step-by-Step Build Guide

## 🎯 Development Phases

### **Phase 1: Foundation & MVP** (Weeks 1-8)
Core functionality to launch with real users

### **Phase 2: Automation & Scale** (Weeks 9-12)
Automate manual processes, improve UX

### **Phase 3: Advanced Features** (Weeks 13-16)
AI, mobile apps, B2B portal

---

## 📅 PHASE 1: FOUNDATION & MVP (8 Weeks)

### **Week 1-2: Setup & Infrastructure**

#### Day 1-3: Repository & Dev Environment
```bash
# 1. Create project structure
mkdir -p coupon-commerce/{backend,frontend,services,docs}
cd coupon-commerce

# 2. Initialize Git
git init
git remote add origin <your-repo-url>

# 3. Setup backend (Elesiya/FastAPI)
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy alembic psycopg2-binary python-jose bcrypt pydantic-settings

# 4. Setup frontend (Next.js)
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --app --src-dir
npm install zustand axios react-hook-form zod @tanstack/react-query

# 5. Setup Bun services
cd ../services/redirector
bun init

# 6. Docker Compose for local dev
cd ../..
```

**Deliverables**:
- ✅ Git repo with `.gitignore`, `README.md`
- ✅ Backend: FastAPI app skeleton
- ✅ Frontend: Next.js with Tailwind
- ✅ Docker Compose: PostgreSQL, Redis containers
- ✅ `.env` files template

---

#### Day 4-7: Database Setup
```sql
-- 1. Create PostgreSQL database
CREATE DATABASE coupon_commerce;

-- 2. Run initial migrations (Alembic)
cd backend
alembic init alembic
alembic revision --autogenerate -m "initial tables"
alembic upgrade head
```

**Tasks**:
1. Create all 18 tables from `02-DATABASE-SCHEMA.md`
2. Add indexes, constraints
3. Create admin user seed script
4. Test queries

**Deliverables**:
- ✅ Complete database schema
- ✅ Alembic migrations
- ✅ Seed data script (10 merchants, 5 categories, 20 sample offers)

---

#### Day 8-14: Authentication System

**Backend Tasks**:
```python
# backend/app/api/v1/auth.py
@router.post("/register")
async def register(data: RegisterSchema, db: Session):
    # 1. Validate input
    # 2. Check if email/mobile exists
    # 3. Hash password (bcrypt)
    # 4. Generate unique referral code
    # 5. Create user
    # 6. Send verification email/SMS
    # 7. Return success
    pass

@router.post("/login")
async def login(data: LoginSchema, db: Session):
    # 1. Find user by email/mobile
    # 2. Verify password
    # 3. Generate JWT token
    # 4. Create session record
    # 5. Return token + user data
    pass

@router.post("/request-otp")
async def request_otp(data: OTPRequestSchema):
    # 1. Generate 6-digit OTP
    # 2. Store in Redis with 5min expiry
    # 3. Send via MSG91/Kaleyra
    pass
```

**Frontend Tasks**:
```tsx
// frontend/src/app/(auth)/login/page.tsx
export default function LoginPage() {
  // 1. Login form with email/password
  // 2. "Login with OTP" button
  // 3. Social login buttons (Google)
  // 4. Form validation (Zod)
  // 5. Call API, store token in Zustand
  // 6. Redirect to homepage
}

// frontend/src/app/(auth)/register/page.tsx
export default function RegisterPage() {
  // Similar to login
  // Add referral code input field
}
```

**Deliverables**:
- ✅ Email/password registration & login
- ✅ Mobile OTP login (with MSG91 integration)
- ✅ JWT token generation & validation
- ✅ Protected routes middleware
- ✅ Google OAuth integration
- ✅ Session management

---

### **Week 3: Merchants & Categories**

#### Backend
```python
# app/api/v1/merchants.py
@router.get("/merchants")
async def list_merchants(
    page: int = 1,
    limit: int = 20,
    category_id: Optional[int] = None,
    is_featured: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # 1. Build query with filters
    # 2. Paginate results
    # 3. Return merchants with offer count
    pass

@router.get("/merchants/{slug}")
async def get_merchant(slug: str, db: Session):
    # Return merchant details + active offers
    pass

@router.get("/categories")
async def list_categories(type: Optional[str] = None, db: Session = Depends(get_db)):
    # Return categories with counts
    pass
```

#### Frontend
```tsx
// frontend/src/app/(main)/merchants/page.tsx
- Merchant grid with search
- Filter sidebar
- Pagination

// frontend/src/app/(main)/merchants/[slug]/page.tsx
- Merchant header with cashback info
- Offers tabs (All, Deals, Codes)
- Related merchants
```

**Deliverables**:
- ✅ Merchants CRUD (admin)
- ✅ Categories CRUD (admin)
- ✅ Merchant listing page
- ✅ Merchant detail page
- ✅ Category navigation component

---

### **Week 4: Offers & Coupons**

#### Backend
```python
# app/api/v1/offers.py
@router.get("/offers")
async def list_offers(filters, db: Session):
    # Complex filtering and sorting
    pass

@router.post("/offers/{uuid}/click")
async def track_click(uuid: str, user_id: Optional[int], db: Session):
    # 1. Create offer_click record
    # 2. Increment offer clicks_count
    # 3. Generate tracking redirect URL
    # 4. Return redirect URL + coupon code
    pass

@router.post("/offers/{uuid}/view")
async def track_view(uuid: str, db: Session):
    # Increment views_count
    pass
```

#### Frontend
```tsx
// frontend/src/app/(main)/coupons/page.tsx
- Advanced filters (merchant, category, type, cashback)
- Sort options
- Offer grid with OfferCard component

// components/offer/OfferCard.tsx
- Display offer details
- "Get Code" button → copy code + track click + open merchant
- "Get Deal" button → track click + redirect
- Cashback badge
```

**Deliverables**:
- ✅ Offers CRUD (admin)
- ✅ Offer listing with filters
- ✅ Click tracking
- ✅ Coupon code copy functionality
- ✅ Redirect service (Bun microservice)

---

### **Week 5: Products & Gift Cards**

#### Backend
```python
# app/api/v1/products.py
@router.get("/products")
async def list_products(filters, db: Session):
    # Return products with variants
    pass

@router.get("/products/{slug}")
async def get_product(slug: str, db: Session):
    # Product details + all variants
    pass
```

#### Frontend
```tsx
// frontend/src/app/(main)/products/page.tsx
- Category tabs
- Product grid
- Price filter

// frontend/src/app/(main)/products/[slug]/page.tsx
- Product images
- Variant selector (₹100, ₹500, ₹1000)
- Add to cart
- Terms & conditions
```

**Deliverables**:
- ✅ Products CRUD (admin)
- ✅ Product variants management
- ✅ Product listing page
- ✅ Product detail page
- ✅ Variant selection logic

---

### **Week 6: Cart & Checkout**

#### Backend
```python
# app/api/v1/cart.py
@router.post("/cart/validate")
async def validate_cart(items: List[CartItem], promo_code: Optional[str], db: Session):
    # 1. Validate each item's availability & price
    # 2. Apply promo code if valid
    # 3. Calculate totals
    # 4. Return validated cart
    pass

# app/api/v1/checkout.py
@router.post("/checkout/create-order")
async def create_order(data: CheckoutSchema, user: User, db: Session):
    # 1. Re-validate cart
    # 2. Create order record
    # 3. Deduct wallet if requested
    # 4. Create Razorpay order
    # 5. Return order + payment details
    pass

@router.post("/checkout/verify-payment")
async def verify_payment(data: PaymentVerificationSchema, db: Session):
    # 1. Verify Razorpay signature
    # 2. Update order & payment status
    # 3. Create wallet transaction if wallet used
    # 4. Trigger order fulfillment (send vouchers)
    # 5. Send confirmation email/SMS
    pass
```

#### Frontend
```tsx
// frontend/src/app/(main)/cart/page.tsx
- Cart items with quantity controls
- Promo code input
- Wallet balance toggle
- Order summary
- "Proceed to Checkout" button

// frontend/src/app/(main)/checkout/page.tsx
- Delivery details form
- Payment method selection
- Razorpay integration
- Place order → open Razorpay modal → verify → redirect to success
```

**Razorpay Integration**:
```tsx
const handlePayment = async () => {
  const orderData = await createOrder({ items, promoCode, walletAmount });
  
  const options = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
    amount: orderData.payment_details.amount,
    currency: 'INR',
    order_id: orderData.payment_details.order_id,
    handler: async (response) => {
      await verifyPayment({
        order_id: orderData.order_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature
      });
      router.push(`/orders/${orderData.order_number}/success`);
    }
  };
  
  const razorpay = new Razorpay(options);
  razorpay.open();
};
```

**Deliverables**:
- ✅ Cart state management (Zustand)
- ✅ Cart validation API
- ✅ Checkout flow
- ✅ Razorpay integration
- ✅ Payment verification
- ✅ Order creation
- ✅ Email/SMS notifications

---

### **Week 7: Orders & Wallet**

#### Backend
```python
# app/api/v1/orders.py
@router.get("/orders")
async def list_orders(user: User, status: Optional[str], db: Session):
    # Return user's orders with pagination
    pass

@router.get("/orders/{order_number}")
async def get_order(order_number: str, user: User, db: Session):
    # Return full order details with voucher codes
    pass

# app/api/v1/wallet.py
@router.get("/wallet")
async def get_wallet(user: User, db: Session):
    # Return balance, pending cashback, lifetime earnings
    pass

@router.get("/wallet/transactions")
async def list_transactions(user: User, filters, db: Session):
    # Return wallet transactions with pagination
    pass

@router.post("/wallet/withdraw")
async def request_withdrawal(data: WithdrawSchema, user: User, db: Session):
    # 1. Validate balance
    # 2. Validate KYC if required
    # 3. Create withdrawal record
    # 4. Deduct from wallet
    # 5. Notify admin
    pass
```

#### Frontend
```tsx
// frontend/src/app/(main)/orders/page.tsx
- Orders list with status filters
- Order cards

// frontend/src/app/(main)/orders/[orderNumber]/page.tsx
- Order timeline
- Items with voucher codes
- "Copy code" buttons
- Download PDF option

// frontend/src/app/(main)/wallet/page.tsx
- Wallet balance cards
- Tabs: Transactions, Cashback Tracker, Withdrawals
- Transaction filters
- Withdraw button → modal
```

**Deliverables**:
- ✅ Orders listing & detail pages
- ✅ Wallet balance display
- ✅ Transaction history
- ✅ Withdrawal request flow
- ✅ Manual voucher code delivery (admin)

---

### **Week 8: Admin Panel & Launch Prep**

#### Admin Pages
```tsx
// frontend/src/app/admin/dashboard/page.tsx
- Metrics cards (revenue, orders, users, pending cashback)
- Charts (revenue, orders by status)

// frontend/src/app/admin/merchants/page.tsx
- Data table with CRUD
- Add/Edit merchant form

// frontend/src/app/admin/offers/page.tsx
- Offers management
- Bulk upload CSV

// frontend/src/app/admin/orders/page.tsx
- Orders table
- Status update
- Fulfill order (add voucher codes)

// frontend/src/app/admin/withdrawals/page.tsx
- Withdrawal requests table
- Approve/Reject actions
```

**Launch Checklist**:
- ✅ Deploy backend to production (AWS EC2 / DigitalOcean)
- ✅ Deploy frontend to Vercel / Netlify
- ✅ Setup PostgreSQL (RDS / Managed DB)
- ✅ Setup Redis (ElastiCache / Upstash)
- ✅ Configure domain & SSL
- ✅ Setup monitoring (Sentry for errors)
- ✅ Load test with 100 concurrent users
- ✅ Create 50+ real offers from popular merchants
- ✅ Add 20+ gift card SKUs
- ✅ Write help docs & FAQ
- ✅ Setup email templates
- ✅ Beta testing with 10 friends

**MVP Features Complete**:
- ✅ User registration & login
- ✅ Browse merchants & categories
- ✅ View & copy coupon codes
- ✅ Click tracking
- ✅ Browse & buy gift cards
- ✅ Cart & checkout
- ✅ Razorpay payment
- ✅ Order management
- ✅ Wallet & manual cashback credit
- ✅ Withdrawal requests (manual approval)
- ✅ Admin panel for CRUD operations

### 🔴 Redis Integration Status (Phase 1 augment)
The original Phase 1 scope did not enumerate explicit Redis tasks. These have now been defined and partially implemented. Below is the Redis feature matrix relative to MVP:

| Redis Feature | Purpose | Phase | Current Status |
|---------------|---------|-------|----------------|
| Session storage (token -> user payload) | Faster auth, avoid DB hit | Week 2 | ✅ Implemented (login stores, logout invalidates) |
| Rate limiting (100 req/min/IP) | Abuse prevention | Week 2 | ✅ Implemented middleware |
| Merchant detail cache | Reduce DB reads | Week 3 | ✅ Implemented (stub data cached) |
| Offer click counters + trending sorted set | Real-time engagement | Week 4 | ✅ Redis counters + trending endpoint |
| Top offers cached list | Hot list (10 min TTL) | Week 4 | 🔄 Pending implementation |
| OTP storage (5 min TTL + attempt tracking) | Secure mobile login | Week 2 | 🔴 Not implemented (stub only) |
| Distributed lock (withdrawal) | Prevent race on balance deduction | Week 7 | 🔴 Not wired (lock helper exists) |
| Referral leaderboard (sorted set) | Gamification | Phase 3 (Week 13) | ⚪ Helper exists, no API |
| Monitoring endpoint (memory, hit rate) | Ops visibility | Phase 2 (Week 12) | 🔴 Not implemented |
| Email/SMS queues (list) | Async processing | Phase 2 (Week 10) | 🔴 Not implemented |
| Cache invalidation endpoints | Data freshness | Week 3–4 | ✅ Merchant invalidation added |

Legend: ✅ done  • 🔄 partial  • 🔴 missing  • ⚪ scheduled later

### ✅ Redis Deliverables Added to Phase 1
1. Session persistence in Redis with 24h TTL.
2. IP-based fixed window rate limiting (100/min) headers.
3. Merchant detail caching (1h) + admin cache invalidation.
4. Offer click tracking + trending ID retrieval (sorted set).

### 🔧 Redis Items Still Required for True MVP Completion
1. OTP generation & verification (key: `otp:<mobile>` + attempt counter).
2. Top offers cached list (key: `offers:top:10`, TTL 600s) populated from DB.
3. Withdrawals: apply `lock:withdraw:<user_id>` around balance update.
4. Basic monitoring endpoint `/admin/redis/stats` returning used memory + hit rate.

### 🗓️ Redistribution of Remaining Redis Tasks
- Week 2 (Authentication): OTP service completion.
- Week 4 (Offers): Implement top offers cache + invalidation on offer update.
- Week 7 (Wallet/Withdrawals): Integrate distributed lock.
- Week 8 (Admin & Launch): Add monitoring endpoint & dashboard metrics.

### 📌 Key Naming Recap (Implemented & Planned)
```
session:<token>
rate_limit:<ip>
cache:merchant:<slug>
offer:<id>:clicks
offers:trending
otp:<mobile>               (pending)
otp:attempts:<mobile>      (pending)
offers:top:10              (pending)
lock:withdraw:<user_id>    (pending usage)
leaderboard:referrals      (Phase 3)
```

### 🚀 Near-Term Action Checklist (Redis)
1. Implement OTP helper (generate, store, verify, attempt throttle).
2. Add `get_top_offers` DB query + caching function.
3. Wrap withdrawal endpoint logic with lock acquire/release.
4. Create `/admin/redis/stats` endpoint exposing `redis_stats()`.

---

---

## 📅 PHASE 2: AUTOMATION & SCALE (Weeks 9-12)

### **Week 9: Affiliate Network Integration**

**Goal**: Auto-sync cashback from affiliate networks (Admitad, VCommission, CueLinks)

#### Tasks
1. **Admitad API Integration**
```python
# app/services/affiliate/admitad.py
class AdmitadClient:
    def get_transactions(self, from_date, to_date):
        # Call Admitad API
        # Map to our cashback_events table
        pass
    
    def sync_cashback(self):
        # Fetch last 30 days transactions
        # Match by click_id or user's email
        # Update cashback_events status
        # Credit to wallet if confirmed
        pass
```

2. **Scheduled Job (Celery / Background Worker)**
```python
# Run every 6 hours
@celery_app.task
def sync_affiliate_cashback():
    admitad_client.sync_cashback()
    vcommission_client.sync_cashback()
```

**Deliverables**:
- ✅ Admitad API integration
- ✅ Auto cashback sync every 6 hours
- ✅ Cashback status updates
- ✅ Email notifications when cashback confirmed

---

### **Week 10: Email & SMS Automation**

#### Tasks
1. **Email Templates** (SendGrid / AWS SES)
   - Welcome email
   - Email verification
   - Order confirmation (with voucher codes)
   - Cashback confirmed
   - Withdrawal processed

2. **SMS Templates** (MSG91)
   - OTP for login
   - Order placed
   - Order fulfilled (with voucher code link)

3. **Event-Driven Architecture**
```python
# app/events/handlers.py
@event_handler('user.registered')
def on_user_registered(user):
    send_welcome_email(user.email)
    send_referral_bonus_if_applicable(user)

@event_handler('order.paid')
def on_order_paid(order):
    send_order_confirmation_email(order)
    send_order_sms(order)

@event_handler('cashback.confirmed')
def on_cashback_confirmed(cashback_event):
    credit_to_wallet(cashback_event)
    send_cashback_notification(cashback_event.user)
```

**Deliverables**:
- ✅ Email templates for all events
- ✅ SMS notifications
- ✅ Event-driven triggers

---

### **Week 11: Advanced Search & Recommendations**

#### Tasks
1. **PostgreSQL Full-Text Search**
```sql
-- Add tsvector column to offers table
ALTER TABLE offers ADD COLUMN search_vector tsvector;
CREATE INDEX idx_offers_search ON offers USING GIN(search_vector);

-- Update trigger
CREATE TRIGGER offers_search_update BEFORE INSERT OR UPDATE
ON offers FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', title, description);
```

2. **Smart Recommendations**
```python
# app/services/recommendations.py
def get_personalized_offers(user_id):
    # Based on user's past clicks, orders, categories
    # Return top 10 offers
    pass

def get_trending_offers():
    # High clicks in last 24 hours
    pass

def get_expiring_soon():
    # Expires in next 7 days, sorted by cashback
    pass
```

**Deliverables**:
- ✅ Fast search across merchants, offers, products
- ✅ Autocomplete search
- ✅ Personalized recommendations on homepage
- ✅ Trending offers section

---

### **Week 12: Performance & Analytics**

#### Tasks
1. **Performance Optimization**
   - Redis caching for hot offers
   - Database query optimization
   - Frontend code splitting
   - Image optimization (WebP, lazy loading)
   - CDN for static assets

2. **Analytics Dashboard**
   - Google Analytics 4 integration
   - Custom events tracking (offer clicks, conversions)
   - Admin analytics:
     - Revenue charts
     - Top performing merchants
     - Category-wise sales
     - Conversion funnel

**Deliverables**:
- ✅ Page load time < 2 seconds
- ✅ API response time < 200ms
- ✅ Complete analytics dashboard
- ✅ A/B testing setup

---

## 📅 PHASE 3: ADVANCED FEATURES (Weeks 13-16)

### **Week 13: Referral System Enhancement**

- ✅ Multi-level referrals (optional)
- ✅ Referral leaderboard
- ✅ Bonus campaigns (refer 5 friends, get ₹500)
- ✅ Social share buttons with tracking

---

### **Week 14: PWA & Mobile App**

- ✅ Convert Next.js to PWA
- ✅ Push notifications
- ✅ Offline support
- ✅ Add to home screen prompt

---

### **Week 15: Corporate B2B Portal**

- ✅ Separate B2B login
- ✅ Bulk gift card orders
- ✅ Custom invoicing (GST)
- ✅ Company dashboard
- ✅ API for enterprise integrations

---

### **Week 16: AI & Automation**

- ✅ AI chatbot for support
- ✅ Automatic offer scraping
- ✅ Price comparison
- ✅ Fraud detection (unusual redemption patterns)

---

## 🚀 Deployment Architecture

### **Production Setup**

```
┌─────────────────┐
│   Cloudflare    │ (CDN + DDoS protection)
└────────┬────────┘
         │
┌────────▼────────┐
│     Vercel      │ (Next.js frontend)
└─────────────────┘
         │
         │ API calls
         │
┌────────▼────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│FastAPI│ │FastAPI│ (Backend instances)
└───┬───┘ └──┬────┘
    │        │
    └────┬───┘
         │
┌────────▼────────┐
│   PostgreSQL    │ (RDS / Managed DB)
└─────────────────┘
         │
┌────────▼────────┐
│      Redis      │ (ElastiCache)
└─────────────────┘
         │
┌────────▼────────┐
│   Bun Service   │ (Redirect microservice)
└─────────────────┘
```

---

## 📊 Success Metrics

### **Phase 1 (MVP)**
- ✅ 100 active users
- ✅ 50+ merchants
- ✅ 200+ offers
- ✅ 20+ gift card SKUs
- ✅ 10 orders/day

### **Phase 2 (Automation)**
- ✅ 1,000 active users
- ✅ 500+ offers
- ✅ ₹1 lakh revenue/month
- ✅ Auto cashback sync working

### **Phase 3 (Advanced)**
- ✅ 10,000 active users
- ✅ ₹10 lakh revenue/month
- ✅ 5 corporate clients
- ✅ Mobile app launched

---

**Next Document**: `06-BUN-SERVICES.md` - Microservices architecture
