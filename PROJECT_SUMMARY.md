# BIDUA Coupons / CouponAli - Project Summary

## Overview

A full-stack coupon/affiliate platform built with:
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: Next.js 16 + React + Tailwind CSS
- **Cache**: Redis

## Architecture

### Backend (`backend/`)
- `app/api/v1/` - API routes (admin.py, merchants.py, users.py, etc.)
- `app/models/` - SQLAlchemy models
- `app/services/` - Business logic services
- `app/schemas/` - Pydantic schemas
- `scripts/` - Utility scripts (seed_homepage.py, create_admin.py)

### Frontend (`frontend/`)
- `src/app/` - Next.js pages (home, admin dashboard, auth)
- `src/lib/api/` - API client modules
- `src/components/` - React components

## Key Features

### User Features
- Register/Login with email/phone
- Browse merchants and coupons
- Click "Get Deal" to be redirected via tracking URL
- Buy gift cards/products
- Wallet system with withdrawals

### Merchant Features
- Apply to become a merchant
- Submit KYC documents
- Add products/coupons after admin approval
- Verification flow: pending -> reviewing -> approved/rejected

### Admin Features
- Dashboard with analytics
- Manage merchants (CRUD + approve/reject)
- Manage offers, products, categories, banners
- Process withdrawal requests
- User management

## Database Models

### Core Models
- **User** - Users with roles (user, admin, merchant)
- **Merchant** - Partner stores with:
  - `tracking_url` - Affiliate tracking link
  - `website_url` - Merchant's website
  - `affiliate_network` - Network (admitad, impact, cuelinks, inhouse)
  - `commission_rate` - Platform commission %
  - `verification_status` - pending/reviewing/approved/rejected
  - `kyc_status` - KYC verification status

### Affiliate Tracking
- **AffiliateClick** - Track user clicks on merchant links
- **AffiliateTransaction** - Track conversions from affiliate networks
- **MerchantCommission** - Commission configurations

### Commerce
- **Order** - User purchases
- **Product** - Gift cards and products
- **Offer** - Coupons/deals from merchants
- **GiftCard** - Prepaid cards

## API Endpoints

### Admin Merchant Management
```
POST   /api/v1/admin/merchants          - Create merchant
GET    /api/v1/admin/merchants          - List merchants
PUT    /api/v1/admin/merchants/{id}     - Update merchant
DELETE /api/v1/admin/merchants/{id}     - Deactivate merchant
POST   /api/v1/admin/merchants/{id}/approve  - Approve pending merchant
POST   /api/v1/admin/merchants/{id}/reject   - Reject pending merchant
```

### Admin Other
```
GET    /api/v1/admin/analytics/dashboard - Dashboard stats
GET    /api/v1/admin/offers             - List offers
GET    /api/v1/admin/products           - List products
GET    /api/v1/admin/users              - List users
GET    /api/v1/admin/withdrawals        - List withdrawals
```

## Credentials

- **Admin Login**: admin@couponali.com / admin123

## Environment Setup

1. PostgreSQL database is auto-configured
2. Redis for caching (optional)
3. Run backend: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
4. Run frontend: `cd frontend && pnpm run dev`

## Seeding Data

```bash
cd backend
python scripts/create_admin.py    # Create admin user
python scripts/seed_homepage.py   # Seed merchants, offers, banners
```

## Recent Changes

### Merchant Form Updates
The admin merchant form now includes:
- Website URL
- Tracking URL (affiliate)
- Affiliate Network (select: admitad, impact, cuelinks, vcommission, inhouse)
- Commission Rate (%)

Files modified:
- `frontend/src/lib/api/admin.ts` - Updated Merchant interface
- `frontend/src/app/admin/merchants/page.tsx` - Added form fields
- `backend/app/api/v1/admin.py` - Updated MerchantPayload schema and CRUD endpoints

## Known Issues

- Banner images show 404 (placeholders not uploaded)
- LSP warnings in admin_merchants.py (unused imports, not critical)

## Next Steps

1. Add merchant KYC document upload UI
2. Implement affiliate click tracking endpoint
3. Add commission reporting dashboard
4. Configure real banner images
