# Project Overview: Advanced Coupon & Gift Card E-Commerce Platform

## 🎯 Project Vision
Build a **hybrid platform** combining:
- **CouponDunia-style**: Coupon aggregation + Cashback + Affiliate tracking
- **GVTadka-style**: E-commerce for digital gift cards & vouchers

**Goal**: Create India's most advanced coupon + gift card marketplace with superior UX, automation, and monetization.

---

## 📊 Website Analysis Summary

### **Downloaded Archives**
- ✅ CouponDunia: **518MB** (complete site mirror)
- ✅ GVTadka: **14MB** (complete site mirror)
- ✅ Total Images: **99+** assets
- 📁 Location: `website-archives/`

### **CouponDunia Features Identified**
1. **Coupon/Offer Listings**
   - Categories: Fashion, Food, Travel, Electronics, Beauty, etc.
   - Merchant-wise organization (Amazon, Flipkart, Myntra, etc.)
   - "Get Code" & "Get Deal" CTAs
   - Cashback % badges on every offer

2. **Cashback System**
   - Wallet balance display
   - Pending/Confirmed/Rejected status tracking
   - Withdrawal options: Bank transfer, Amazon voucher, Mobile recharge
   - Referral system (10% lifetime commission)

3. **User Authentication**
   - Email + Password login
   - Social login (Google, Facebook)
   - Mobile OTP verification
   - Referral code at signup

4. **SEO-Heavy Content**
   - Static pages for bank offers, festival sales
   - Category landing pages
   - Blog integration
   - FAQ and support sections

5. **Tracking & Analytics**
   - Click tracking via redirect links
   - Affiliate conversion tracking
   - Missing cashback claim system

### **GVTadka Features Identified**
1. **Product Catalog**
   - Categories: Food Gift Cards, Jewellery, Lifestyle, Travel, LUXE, E-commerce
   - Digital gift card SKUs (e.g., EGVGBFLSCLPS001)
   - Price variants (₹100, ₹500, ₹1000, etc.)

2. **E-commerce Flow**
   - Product detail pages
   - Cart system
   - Checkout with payment gateway
   - Order tracking
   - Email/SMS delivery of voucher codes

3. **User Account**
   - My Account dashboard
   - Order history
   - Customer service & FAQ

4. **Footer Navigation**
   - Terms & Conditions
   - Privacy Policy
   - Refund/Cancel policy
   - Contact information

---

## 🏗️ Tech Stack Decision

### **Frontend**
- **Framework**: Next.js 14+ (React 18+)
- **Why**: SEO critical for coupon sites, SSR/SSG support, App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: Zustand + TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation

### **Backend**
- **Primary API**: Elesiya (FastAPI + Python)
- **Why**: You're already using it, excellent for complex business logic
- **Runtime**: Python 3.11+
- **ORM**: SQLAlchemy 2.0 + Alembic migrations

### **Microservices (Bun)**
- **Click Redirector**: Ultra-fast redirect service for affiliate tracking
- **Webhook Handler**: Process payment gateway callbacks
- **Job Queue Worker**: Background tasks (email, SMS, cashback sync)

### **Database**
- **PostgreSQL 15+**
- **Extensions**: pgvector (for AI recommendations), pg_trgm (fuzzy search)

### **Infrastructure**
- **Cache**: Redis (session, rate limiting, hot offers)
- **Queue**: Bull/BullMQ (job processing)
- **File Storage**: S3-compatible (gift card images, receipts)
- **CDN**: Cloudflare (static assets)

### **Payment Gateway**
- **Primary**: Razorpay (India-focused, easy integration)
- **Backup**: PhonePe / Cashfree

### **Communication**
- **SMS**: MSG91 / Kaleyra (OTP, order updates)
- **Email**: AWS SES / SendGrid (transactional emails)
- **Push**: Firebase Cloud Messaging (optional)

---

## 🎨 Design System (Based on Downloaded Sites)

### **Color Palette** (Inspired by your preference)
```css
Primary Purple: #5F259F
Secondary: #8B3FBF
Accent: #FF6B35
Success (Cashback): #10B981
Warning: #F59E0B
Error: #EF4444
Neutral Gray: #64748B
Background: #F8FAFC
```

### **Typography**
- Headings: Inter Bold / Poppins Bold
- Body: Inter Regular
- Code/SKU: JetBrains Mono

### **Key UI Components Needed**
1. Offer Card (with cashback badge)
2. Merchant Logo Grid
3. Category Navigation
4. Coupon Code Display (click to copy)
5. Wallet Balance Widget
6. Product Card (gift cards)
7. Cart Drawer
8. Checkout Stepper
9. Order Status Timeline
10. Admin Dashboard Tables

---

## 📈 Competitive Advantages Over Reference Sites

### **Better Than CouponDunia**
1. ✨ **AI-Powered Recommendations**: Personalized offers using user behavior
2. 🚀 **Real-time Cashback Tracking**: Auto-sync with affiliate networks
3. 💎 **Gamification**: Badges, streaks, leaderboards for engagement
4. 📱 **PWA Support**: Installable mobile app experience
5. 🔔 **Smart Notifications**: Price drop alerts, expiring offers
6. 🎯 **Better UX**: Faster search, filters, modern design

### **Better Than GVTadka**
1. 🎁 **Bulk Corporate Orders**: B2B portal for companies
2. 💳 **Subscription Plans**: Monthly gift card boxes
3. 🔄 **Gift Card Exchange**: Trade unwanted cards
4. 📊 **Analytics for Buyers**: Track spending, recommendations
5. ⚡ **Instant Delivery**: Automated voucher generation
6. 🛡️ **Fraud Protection**: Advanced validation system

### **Unique Hybrid Features**
1. **Cashback on Gift Cards**: Earn cashback when buying gift cards
2. **Gift Card as Payment**: Use gift cards to buy more gift cards
3. **Unified Wallet**: Single balance for cashback + gift card value
4. **Smart Bundling**: "Buy Amazon card + get 5% Flipkart cashback"
5. **Social Sharing**: Refer friends, share deals, earn commission

---

## 🎯 Target Audience

### **Primary**
1. **Deal Hunters** (18-35 years)
   - Tech-savvy, price-conscious
   - Active on social media
   - Regular online shoppers

2. **Corporate Buyers** (HR, Admin teams)
   - Bulk gift card purchases
   - Employee rewards, festival gifting
   - Need invoices, GST compliance

### **Secondary**
1. **Gift Givers** (all ages)
   - Birthdays, anniversaries, festivals
   - Need convenient digital options

2. **Cashback Enthusiasts**
   - Want to maximize savings
   - Willing to track offers

---

## 💰 Revenue Streams

1. **Affiliate Commissions** (Primary)
   - 2-15% commission from merchants
   - User gets 50-80% as cashback, we keep rest

2. **Gift Card Markup** (5-10%)
   - Buy at wholesale, sell at slight markup
   - Volume discounts from suppliers

3. **Featured Listings** (Merchant Ads)
   - Pay to appear in "Top Offers"
   - Sponsored categories

4. **Premium Subscriptions** (Optional)
   - Higher cashback rates
   - Early access to deals
   - No minimum withdrawal

5. **Corporate B2B**
   - Volume discounts
   - Custom branding
   - API access for integration

---

## 📦 Project Deliverables

### **Phase 1: MVP (2-3 months)**
- User auth (email, mobile OTP)
- Coupon listings (manual entry)
- Basic affiliate redirect
- Gift card catalog (10-20 SKUs)
- Cart + Razorpay checkout
- Simple admin panel
- Wallet (manual cashback credit)

### **Phase 2: Automation (1-2 months)**
- Auto affiliate network integration
- Email/SMS notifications
- Advanced search & filters
- Referral system
- Withdrawal automation (UPI)
- Analytics dashboard

### **Phase 3: Advanced (2-3 months)**
- AI recommendations
- PWA + mobile app
- Corporate B2B portal
- Gift card exchange
- Gamification
- Advanced fraud detection

---

## 📁 Repository Structure

```
coupon-commerce/
├── backend/                 # Elesiya FastAPI app
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── core/           # Config, auth, utils
│   ├── alembic/            # DB migrations
│   └── tests/
├── frontend/               # Next.js app
│   ├── src/
│   │   ├── app/           # Next.js 14 App Router
│   │   ├── components/    # React components
│   │   ├── lib/           # Utils, API client
│   │   └── store/         # Zustand stores
│   └── public/
├── services/              # Bun microservices
│   ├── redirector/        # Click tracking service
│   ├── webhooks/          # Payment webhooks
│   └── workers/           # Background jobs
├── docs/                  # Documentation (this folder)
├── website-archives/      # Downloaded reference sites
└── docker-compose.yml     # Local dev environment
```

---

## 🚀 Next Steps

Proceed to:
1. **02-DATABASE-SCHEMA.md** - Complete PostgreSQL schema
2. **03-API-SPECIFICATION.md** - All backend endpoints
3. **04-FRONTEND-ARCHITECTURE.md** - Pages, components, flows
4. **05-IMPLEMENTATION-ROADMAP.md** - Step-by-step build guide

---

**Status**: ✅ Downloaded both websites, analyzed features, defined tech stack
**Next**: Create detailed database schema
