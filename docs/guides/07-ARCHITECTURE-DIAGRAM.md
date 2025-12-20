# System Architecture Diagram

## 🏗️ Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  👨‍💻 Web Browser          📱 Mobile Browser         🖥️ Admin Panel    │
│  (Desktop/Laptop)        (Responsive/PWA)         (Dashboard)        │
│                                                                       │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Next.js 14 (React + TypeScript)                 │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  Pages/Routes:                  State Management:            │   │
│  │  • / (Homepage)                 • Zustand (auth, cart)       │   │
│  │  • /merchants                   • TanStack Query (API cache) │   │
│  │  • /coupons                                                   │   │
│  │  • /products                    Styling:                      │   │
│  │  • /cart → /checkout            • Tailwind CSS               │   │
│  │  • /wallet                      • shadcn/ui components       │   │
│  │  • /orders                                                    │   │
│  │  • /profile                     SEO:                          │   │
│  │  • /admin/*                     • SSR/SSG for merchants      │   │
│  │                                 • Dynamic metadata           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Deployment: Vercel / Netlify                                        │
│  CDN: Cloudflare                                                     │
│                                                                       │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ HTTPS/REST
                        │ JSON
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER                     │
├─────────────────────────────────────────────────────────────────────┤
│  • Rate Limiting                                                     │
│  • SSL Termination                                                   │
│  • Request Routing                                                   │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
┌───────────────────────┐  ┌───────────────────────┐
│   BACKEND LAYER       │  │  MICROSERVICES (Bun)  │
├───────────────────────┤  ├───────────────────────┤
│                       │  │                       │
│  Elesiya (FastAPI)    │  │  1️⃣ Redirector        │
│  Python 3.11+         │  │     • Click tracking  │
│                       │  │     • Ultra-fast      │
│  API Routes:          │  │     • < 30ms latency  │
│  • /auth/*            │  │     Port: 3001        │
│  • /merchants/*       │  │                       │
│  • /offers/*          │  │  2️⃣ Webhooks          │
│  • /products/*        │  │     • Razorpay        │
│  • /cart/*            │  │     • PhonePe         │
│  • /checkout/*        │  │     • Signature verify│
│  • /orders/*          │  │     Port: 3002        │
│  • /wallet/*          │  │                       │
│  • /admin/*           │  │  3️⃣ Workers           │
│                       │  │     • Email queue     │
│  Features:            │  │     • SMS queue       │
│  • JWT auth           │  │     • Cashback sync   │
│  • SQLAlchemy ORM     │  │     • Cron jobs       │
│  • Pydantic schemas   │  │                       │
│  • Alembic migrations │  │                       │
│                       │  │                       │
│  Deployment:          │  │  Deployment:          │
│  • AWS EC2 / DO       │  │  • Docker containers  │
│  • Uvicorn + Gunicorn │  │  • Bun runtime        │
│  • 2+ instances       │  │                       │
│                       │  │                       │
└───────┬───────────────┘  └───────────┬───────────┘
        │                              │
        │                              │
        ▼                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────┐       ┌─────────────────────┐             │
│  │  PostgreSQL 15+     │       │  Redis              │             │
│  ├─────────────────────┤       ├─────────────────────┤             │
│  │                     │       │                     │             │
│  │  Tables (18):       │       │  Use Cases:         │             │
│  │  • users            │       │  • Session store    │             │
│  │  • merchants        │       │  • OTP cache        │             │
│  │  • categories       │       │  • Rate limiting    │             │
│  │  • offers           │       │  • Hot offers cache │             │
│  │  • offer_clicks     │       │  • Job queue        │             │
│  │  • products         │       │                     │             │
│  │  • orders           │       │  Deployment:        │             │
│  │  • order_items      │       │  • ElastiCache      │             │
│  │  • payments         │       │  • Upstash          │             │
│  │  • wallet_trans.    │       │                     │             │
│  │  • cashback_events  │       │                     │             │
│  │  • withdrawals      │       │                     │             │
│  │  • referrals        │       │                     │             │
│  │  • ...              │       │                     │             │
│  │                     │       │                     │             │
│  │  Deployment:        │       │                     │             │
│  │  • AWS RDS          │       │                     │             │
│  │  • Supabase         │       │                     │             │
│  │  • Neon             │       │                     │             │
│  │                     │       │                     │             │
│  └─────────────────────┘       └─────────────────────┘             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  💳 Payment Gateways:                                                │
│     • Razorpay (Primary)                                             │
│     • PhonePe / Cashfree (Backup)                                    │
│                                                                       │
│  📧 Communication:                                                   │
│     • SendGrid / AWS SES (Email)                                     │
│     • MSG91 / Kaleyra (SMS)                                          │
│                                                                       │
│  💰 Affiliate Networks:                                              │
│     • Admitad                                                        │
│     • VCommission                                                    │
│     • CueLinks                                                       │
│                                                                       │
│  🔍 Analytics:                                                       │
│     • Google Analytics 4                                             │
│     • Sentry (Error tracking)                                        │
│                                                                       │
│  ☁️ Storage:                                                         │
│     • AWS S3 / Cloudflare R2                                         │
│     • Images, receipts, exports                                      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Flows

### **Flow 1: User Clicks Offer → Earns Cashback**

```
1. User visits /merchants/amazon
2. Clicks "Get Code" on offer
   ↓
3. Frontend calls: POST /offers/{uuid}/click
   ↓
4. Backend creates offer_click record
   ↓
5. Backend returns:
   • Click ID (UUID)
   • Redirect URL (via Bun redirector)
   • Coupon code (if applicable)
   ↓
6. Frontend displays code + opens new tab
   ↓
7. Bun redirector service:
   • Logs click details (IP, user-agent, device)
   • Increments click count
   • Redirects to merchant (< 30ms)
   ↓
8. User shops on merchant site
   ↓
9. Background worker syncs cashback from affiliate network
   ↓
10. Cashback confirmed → credited to wallet
    ↓
11. Email sent: "₹50 cashback credited!"
```

---

### **Flow 2: User Buys Gift Card**

```
1. User browses /products (gift cards)
2. Selects "Flipkart ₹500 Gift Card"
   ↓
3. Adds to cart (Zustand store)
   ↓
4. Goes to /cart
5. Applies promo code (optional)
6. Toggles "Use wallet balance"
   ↓
7. Clicks "Proceed to Checkout"
   ↓
8. Frontend calls: POST /cart/validate
   • Backend validates availability, prices
   ↓
9. User enters delivery email/mobile
   ↓
10. Clicks "Place Order"
    ↓
11. Frontend calls: POST /checkout/create-order
    • Backend creates order (status: pending)
    • Deducts wallet if used
    • Creates Razorpay order
    ↓
12. Razorpay modal opens
    • User pays ₹400 (₹500 - ₹100 wallet)
    ↓
13. Payment success → Razorpay webhook → Bun service
    ↓
14. Bun calls: PATCH /internal/orders/{id}/update-payment
    • Backend verifies signature
    • Updates order (status: paid)
    • Updates payment record
    ↓
15. Backend triggers fulfillment:
    • Generates voucher codes (or fetches from supplier)
    • Saves to order_items.voucher_codes
    • Updates order (status: fulfilled)
    ↓
16. Email worker sends:
    • Order confirmation email with codes
    ↓
17. SMS worker sends:
    • "Your Flipkart voucher: ABC123XYZ"
    ↓
18. User receives codes instantly!
```

---

### **Flow 3: User Withdraws Cashback**

```
1. User goes to /wallet
2. Sees balance: ₹1,250
   ↓
3. Clicks "Withdraw"
   ↓
4. Selects method: UPI
5. Enters UPI ID: john@paytm
   ↓
6. Frontend calls: POST /wallet/withdraw
   • Backend validates:
     - Balance sufficient?
     - KYC completed?
     - Min withdrawal met? (₹100)
   ↓
7. Backend creates withdrawal request (status: pending)
8. Deducts from wallet (temporary hold)
   ↓
9. Admin receives notification
   ↓
10. Admin reviews in /admin/withdrawals
    • Approves request
    ↓
11. Backend calls: PATCH /admin/withdrawals/{id}/approve
    ↓
12. Manual process: Admin sends UPI payment
    ↓
13. Admin marks as completed with UTR
    ↓
14. Email sent: "Withdrawal processed! UTR: 123456"
    ↓
15. User receives ₹1,250 in bank!
```

---

## 📊 Database Relationships

```
users
  ├─→ user_sessions (1:many)
  ├─→ user_kyc (1:1)
  ├─→ orders (1:many)
  ├─→ wallet_transactions (1:many)
  ├─→ cashback_events (1:many)
  ├─→ withdrawals (1:many)
  └─→ referrals (as referrer and referred, many:many)

merchants
  ├─→ offers (1:many)
  ├─→ products (1:many)
  └─→ merchant_commissions (1:many)

categories
  ├─→ offers (1:many)
  ├─→ products (1:many)
  └─→ categories (self-referencing for subcategories)

offers
  ├─→ offer_clicks (1:many)
  └─→ cashback_events (1:many)

products
  └─→ product_variants (1:many)

orders
  ├─→ order_items (1:many)
  └─→ payments (1:many)
```

---

## 🚀 Deployment Architecture

### **Production Environment**

```
┌─────────────────────┐
│   Cloudflare CDN    │  (Global edge network)
│   • Static assets   │
│   • DDoS protection │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Vercel (Frontend) │
│   • Next.js 14      │
│   • Auto-scaling    │
│   • Edge functions  │
└──────────┬──────────┘
           │ API calls
           ▼
┌─────────────────────┐
│  AWS Load Balancer  │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌──────┐      ┌──────┐
│ API  │      │ API  │  (FastAPI instances)
│ EC2  │      │ EC2  │  • Auto-scaling group
│ #1   │      │ #2   │  • Min: 2, Max: 10
└──┬───┘      └───┬──┘
   │              │
   └──────┬───────┘
          │
          ▼
    ┌─────────────┐
    │ PostgreSQL  │  (AWS RDS)
    │ Multi-AZ    │  • Automated backups
    │ Read replica│  • Point-in-time recovery
    └─────────────┘
          │
          ▼
    ┌─────────────┐
    │ Redis       │  (ElastiCache)
    │ Cluster     │  • 2 nodes
    └─────────────┘
```

### **Monitoring Stack**

```
┌─────────────────┐
│  Sentry         │  Error tracking
├─────────────────┤
│  DataDog        │  Infrastructure monitoring
├─────────────────┤
│  LogRocket      │  Session replay
├─────────────────┤
│  Google Analytics│ User behavior
└─────────────────┘
```

---

## 💰 Cost Breakdown (Monthly)

### **Minimal Setup** (MVP)
- Vercel: **₹0** (Hobby plan)
- Backend VPS: **₹800** (2GB RAM)
- PostgreSQL: **₹0** (Supabase free tier)
- Redis: **₹0** (Upstash free tier)
- Domain: **₹100/year**
- **Total: ~₹800/month**

### **Production** (1000+ users/day)
- Vercel: **₹0** (Still free)
- Backend: **₹5,000** (2x t3.medium EC2)
- RDS PostgreSQL: **₹3,000** (db.t3.small)
- ElastiCache: **₹2,000**
- S3 + CloudFront: **₹500**
- Razorpay: **2% per transaction**
- SendGrid: **₹500** (10K emails)
- MSG91: **₹1,500** (500 SMS)
- **Total: ~₹12,500/month + 2% txn**

### **Scale** (10,000+ users/day)
- **₹25,000-40,000/month**

---

## 📈 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Page Load (Homepage)** | < 2 seconds | Next.js SSR |
| **API Response (Auth)** | < 100ms | JWT validation |
| **API Response (Offers)** | < 200ms | With Redis cache |
| **Redirector Latency** | < 30ms | Bun ultra-fast |
| **Checkout Flow** | < 5 seconds | End-to-end |
| **Database Queries** | < 50ms | Indexed queries |
| **Uptime** | 99.9% | Load balanced |

---

## 🔒 Security Measures

1. **Authentication**
   - Bcrypt password hashing (12 rounds)
   - JWT with short expiry (1 hour)
   - Refresh token rotation

2. **API Security**
   - Rate limiting (100 req/min per IP)
   - CORS configuration
   - Input validation (Pydantic)
   - SQL injection prevention (ORM)

3. **Payment Security**
   - Razorpay signature verification
   - HTTPS only
   - PCI DSS compliance

4. **Data Protection**
   - Encrypted sensitive fields (PAN, bank details)
   - Daily automated backups
   - GDPR compliance ready

---

**This completes the architecture documentation!** 🎉

All systems designed, documented, and ready to implement.
