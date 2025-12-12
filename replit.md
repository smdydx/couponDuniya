# CouponAli - Coupon & Cashback Platform

## Overview

CouponAli is a production-grade coupon and cashback platform for merchants, offers, gift cards, wallet management, and referral systems. Built with enterprise-level architecture featuring Next.js frontend and FastAPI backend.

**Note:** This platform focuses exclusively on coupon-based commerce (not traditional e-commerce/dropshipping).

## Project Structure

```
couponali/
├── backend/                    # Python FastAPI Backend
│   ├── alembic/               # Database migrations
│   ├── app/                   # Main application
│   │   ├── api/v1/           # API route handlers
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic services
│   │   ├── config.py         # Configuration settings
│   │   ├── database.py       # Database connection
│   │   ├── main.py           # FastAPI app entry point
│   │   └── security.py       # Auth & JWT handling
│   ├── scripts/              # Utility & seed scripts
│   └── requirements.txt      # Python dependencies
│
├── frontend/                   # Next.js 16 Frontend
│   ├── public/               # Static assets
│   │   └── images/          # Images (merchants, coupons, gift-cards)
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities & API clients
│   │   ├── store/           # Zustand state stores
│   │   └── types/           # TypeScript types
│   └── package.json         # Node.js dependencies
│
├── docs/                       # Documentation
└── replit.md                   # This file
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11, SQLAlchemy ORM |
| Database | PostgreSQL (Neon) |
| State | Zustand (frontend), Redis (backend cache) |
| Auth | JWT tokens, bcrypt password hashing |

## Running the Project

**Backend (Port 8000):**
```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (Port 5000):**
```bash
cd frontend && npm run dev
```

## Core Domains

### Backend API Modules
- **Auth & Users**: auth, users, sessions, social_auth, two_factor, kyc
- **Merchants & Offers**: merchants, offers, categories, gift_cards
- **Wallet & Cashback**: wallet, cashback, withdrawals, payouts
- **Referrals & Affiliates**: referrals, affiliate, commissions
- **Homepage & Content**: homepage, newsletter
- **Admin**: admin, admin_referrals, admin_support, access, audit_logs
- **Notifications**: notifications, push, support_tickets
- **System**: health, uploads, queue, realtime, flags, offer_views

### Database Models
- Users & Authentication (User, UserSession, User2FA, UserKYC)
- Merchants & Affiliates (Merchant, AffiliateClick, AffiliateTransaction)
- Offers & Coupons (Offer, Category, Banner, PromoCode)
- Gift Cards (GiftCard)
- Wallet & Cashback (WalletTransaction, WalletBalance, Withdrawal)
- Referrals (Referral)
- Admin & Support (Role, Permission, AuditLog, SupportTicket)

## Key Features

- User authentication (email/phone OTP, social login)
- Merchant & offer management
- Gift card system with email delivery
- Multi-level referral program (50 levels)
- Wallet with cashback tracking
- Admin dashboard with analytics
- Newsletter & push notifications

## Environment Variables

Required secrets (set in Replit Secrets):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - JWT signing key
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` - Payment gateway
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` - SMS service
- `SENDGRID_API_KEY` - Email service

## Recent Changes (December 12, 2025)

### Project Import Complete
- Python 3.11 and Node.js 20 installed
- All backend packages installed from requirements.txt
- All frontend packages installed via npm
- PostgreSQL database created and connected
- Alembic migration generated and executed (initial_schema)
- Fixed postgresql dialect import in migration file
- Homepage data seeded successfully
- Both Backend (port 8000) and Frontend (port 5000) running

### Backend Cleanup (Coupon-Focused)
- Removed all dropshipping-related models: Product, ProductVariant, Order, OrderItem, Inventory, Shipping, Returns, Reviews
- Removed unused API endpoints: products, cart, checkout, orders, inventory, blog, cms, search, redirects
- Updated admin.py to remove Product/Order CRUD (now focuses on Merchants, Offers, Gift Cards, Users, Banners, Withdrawals)
- Updated homepage.py to use GiftCard instead of Product
- Updated categories.py to count Offers instead of Products
- Fixed import issues in newsletter.py and push.py (get_current_user from dependencies)
- Installed pywebpush for push notification support
- Backend now starts successfully on port 8000

## Pending Work for Next Session

### User Flow
1. User registration/login - partially implemented
2. User profile with optional verification for merchants
3. Coupon browsing and purchase flow
4. Merchant deal integration with commission tracking

### Merchant Flow
1. Merchant registration with full verification
2. Admin approval workflow for merchant requests
3. Merchant dashboard for adding coupons/offers
4. Commission management for merchants

### Admin Dashboard
1. Complete merchant approval UI
2. Coupon/offer management
3. User management with KYC verification
4. Commission distribution tracking
