# CouponAli - Replit Setup

## Overview

CouponAli is a full-stack e-commerce platform designed for coupons, cashback offers, and gift cards, aspiring to become a comprehensive dropshipping solution comparable to major e-commerce platforms. It aims to provide a robust, scalable system for managing merchants, products, orders, and an extensive affiliate network. The platform features a dynamic admin dashboard for operations and analytics, integrating advanced data models for Indian compliance and diverse e-commerce functionalities.

## User Preferences

- Development environment for testing the full stack
- Production deployment requires proper database, Redis, and third-party API keys

## System Architecture

The project is a full-stack application with a Next.js 16 (React 19, TypeScript) frontend on Port 5000 and a FastAPI (Python 3.11) backend on Port 8000. It uses SQLite for development (with PostgreSQL as the production database), and Redis is gracefully mocked for caching. Additional microservices (redirector, webhooks) are built with Bun.

**UI/UX Decisions:**
The admin dashboard features a professional and colorful UI with:
- **Colorful Gradient Cards:** For displaying statistics.
- **Referral System Visualization:** A 50-level matrix and binary tree view with zoom, search, and color-coded legends.
- **Enhanced Product & Category Pages:** Including category selection dropdowns, filter options, and CRUD operations.

**Technical Implementations & Feature Specifications:**
- **Production-level Data Models:** Comprehensive models for Merchant, Product, Order, Returns & Refunds, Reviews & Ratings, Shipping, Address, Brand, and Category, supporting complex e-commerce operations and Indian compliance requirements (e.g., GSTIN, HSN code).
- **Admin Dashboard Authentication:** Secure login using JWT tokens stored in `localStorage`, with auto-redirection to the dashboard post-login. Passwords are hashed using `passlib` with `pbkdf2_sha256`.
- **State Management:** Frontend uses Zustand for state management, specifically `createWithEqualityFn` and `skipHydration` for persistence, to address SSR and hydration issues.
- **Replit Proxy Configuration:** Frontend is dynamically configured to adapt to Replit's preview proxy system, ensuring correct functionality across varying workspace URLs.
- **Real-time Features:** Utilizes WebSockets and Redis for real-time functionalities.
- **API Documentation:** Accessible via Swagger UI and ReDoc.

**System Design Choices:**
- **Modular Structure:** Clearly separated frontend, backend, and microservices for maintainability and scalability.
- **Database Migrations:** Managed with Alembic for schema evolution.
- **Environment Variable Management:** Utilizes `.env` files and Replit's environment variables for configuration.
- **Seeded Data:** Includes pre-populated data for merchants, coupons, and gift cards to facilitate immediate testing.

## External Dependencies

- **Database:** SQLite (development), PostgreSQL (production, configured via Replit's Database tool)
- **Cache:** Redis (mocked in development, Upstash recommended for production)
- **Payment Gateway:** Razorpay (for Indian market, requires `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
- **SMS Service:** MSG91 (optional, requires credentials when `SMS_ENABLED=True`)
- **Email Service:** SendGrid (optional, requires API key when `EMAIL_ENABLED=True`)
- **Affiliate Networks:** Admitad, VCommission, CueLinks (optional, requires credentials)
- **Frontend Framework:** Next.js 16
- **Backend Framework:** FastAPI
- **Package Managers:** Bun (for microservices), npm (for frontend), pip (for backend)
- **Password Hashing:** `passlib`
- **State Management:** Zustand