# CouponDunia - Coupon & Cashback Platform

## Overview
CouponDunia is a full-stack coupon/cashback platform with a FastAPI backend and Next.js frontend. The platform allows:
- **Users**: Register, login, browse coupons/gift cards, and earn cashback
- **Merchants**: Apply for verification, get approved, and list their coupons/deals
- **Admin**: Manage merchants, coupons, gift cards, users, and commission distribution

## Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── config.py       # Configuration
│   │   ├── database.py     # Database connection
│   │   └── main.py         # FastAPI application
│   ├── alembic/            # Database migrations
│   ├── scripts/            # Utility scripts
│   └── requirements.txt
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   ├── lib/           # API client and utilities
│   │   └── store/         # Zustand state stores
│   └── package.json
└── docs/                   # Documentation
```

## Technology Stack

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **Authentication**: JWT with password hashing
- **Cache**: Redis (optional)

### Frontend
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **API Client**: Axios with React Query

## Key Features

### User System
- Email/mobile registration and login
- Profile management with optional KYC verification
- Wallet system for cashback
- Referral system

### Merchant System
- Merchant registration with business details
- KYC verification workflow (pending -> under_review -> approved/rejected)
- Commission rate management
- Product/offer management

### Admin Dashboard
- Comprehensive dashboard with stats
- Merchant approval workflow
- Coupon and offer management
- Gift card management
- User management
- Withdrawal processing
- Analytics

### Commission System
- Platform commission rate per merchant
- TCS/TDS calculation support
- Automatic commission distribution
- Payout management

## Environment Variables

Key environment variables (stored as secrets):
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key
- `CORS_ORIGINS`: Allowed frontend origins

## Running the Project

### Development
- Backend: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Frontend: `cd frontend && npm run dev`

### Credentials
- Admin: admin@couponali.com / admin123

## API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Recent Changes
- December 12, 2025: Project import and setup completed
  - Database migrations applied
  - Admin user created
  - Test merchants and offers seeded
  - Backend and frontend workflows configured

## Next Steps / TODO
1. Complete merchant verification workflow UI
2. Implement coupon purchase flow
3. Add commission tracking dashboard
4. Integrate payment gateway for purchases
5. Add merchant self-service portal
6. Implement notification system
