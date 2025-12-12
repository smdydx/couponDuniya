# CouponAli - E-Commerce Coupons & Cashback Platform

## Overview

CouponAli is a production-grade e-commerce platform for coupons, cashback offers, gift cards, and dropshipping. Built with enterprise-level architecture featuring Next.js frontend and FastAPI backend.

## Project Structure

```
couponali/
├── backend/                    # Python FastAPI Backend
│   ├── alembic/               # Database migrations
│   ├── app/                   # Main application
│   │   ├── api/              # API route handlers
│   │   ├── models/           # SQLAlchemy database models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic services
│   │   ├── tasks/            # Background task handlers
│   │   ├── config.py         # Configuration settings
│   │   ├── database.py       # Database connection
│   │   ├── main.py           # FastAPI app entry point
│   │   └── security.py       # Auth & JWT handling
│   ├── scripts/              # Utility & seed scripts
│   ├── tests/                # Backend unit tests
│   ├── workers/              # Background job workers
│   ├── uploads/              # User uploaded content
│   └── requirements.txt      # Python dependencies
│
├── frontend/                   # Next.js 16 Frontend
│   ├── public/               # Static assets
│   │   └── images/          # Images (logos, merchants, etc)
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── (auth)/     # Authentication pages
│   │   │   ├── (main)/     # Main user pages
│   │   │   ├── admin/      # Admin dashboard
│   │   │   └── api/        # API routes
│   │   ├── components/      # React components
│   │   │   ├── admin/      # Admin components
│   │   │   ├── auth/       # Auth components
│   │   │   ├── common/     # Shared components
│   │   │   ├── layout/     # Layout components
│   │   │   ├── ui/         # UI primitives
│   │   │   └── wallet/     # Wallet components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities & API clients
│   │   ├── store/          # Zustand state stores
│   │   └── types/          # TypeScript types
│   └── package.json        # Node.js dependencies
│
├── docs/                       # Documentation
│   ├── architecture/         # System architecture docs
│   └── guides/              # Setup & API guides
│
├── README.md                  # Project documentation
└── replit.md                  # This file
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

## Key Features

- User authentication (email/phone OTP, social login)
- Merchant & offer management
- Gift card system with email delivery
- Multi-level referral program (50 levels)
- Wallet with cashback tracking
- Admin dashboard with analytics
- Order management & shipping integration

## Environment Variables

Required secrets (set in Replit Secrets):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - JWT signing key
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` - Payment gateway
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` - SMS service
- `SENDGRID_API_KEY` - Email service

## Recent Changes (December 12, 2025)

- Cleaned up project structure to MNC-level organization
- Removed duplicate folders and unnecessary files
- Consolidated documentation into docs/
- Fixed frontend/backend API alignment
