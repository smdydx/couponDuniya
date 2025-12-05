# CouponAli - Replit Setup

## Project Overview

This is a full-stack e-commerce platform for coupons, cashback offers, and gift cards. The project has been fully configured and is running in the Replit environment.

**Architecture:**
- **Frontend**: Next.js 16 + React 19 + TypeScript (Port 5000)
- **Backend**: FastAPI + Python 3.11 (Port 8000)
- **Database**: SQLite (./couponali.db - lightweight, no external setup needed)
- **Cache**: Redis gracefully mocked (works without Redis in development)
- **Additional Services**: Bun-based microservices (redirector, webhooks)

## Current Status

✅ **Fully Operational:**
- Python dependencies installed
- Node.js dependencies installed (using Bun)
- Frontend workflow configured and running on port 5000
- Backend workflow configured and running on port 8000
- SQLite database created and seeded with real data
- All API endpoints tested and working
- Frontend successfully fetching and displaying backend data
- Next.js configured for Replit proxy (0.0.0.0:5000 with dynamic allowed origins)
- Redis gracefully mocked for development
- Git ignore file created
- Admin dashboard accessible without login (no authentication required)

## Recent Changes (December 2024)

### Admin Dashboard Redesign - Professional Colorful UI
The admin dashboard has been completely redesigned with a vibrant, professional colorful UI:

1. **Colorful Gradient Cards**: All stat cards now use beautiful gradient backgrounds (purple, blue, green, orange, pink, teal)

2. **Referral System with 50-Level Matrix**:
   - `/admin/referrals` - Full 50-level matrix table showing users, commission rates, and earnings per level
   - Colorful stat cards for Total Users, With Referrals, Total Earnings, Avg Referrals, Max Level

3. **Referral Tree Visualization**:
   - `/admin/referrals/tree` - Binary tree view with left/right child structure
   - Zoom controls (in/out/fullscreen)
   - Search and filter by user
   - View depth selector (1-10 levels)
   - Color-coded legend for Active/Inactive users and connection lines

4. **Enhanced Products Page**:
   - Category selection dropdown when adding/editing products
   - Colorful gradient stat cards (Total Products, Active Products, Out of Stock, Inventory Value)
   - Category filter dropdown

5. **Enhanced Categories Page**:
   - Full CRUD operations (Create, Read, Update, Delete)
   - Colorful gradient stat cards
   - Professional table with status badges

**Navigation**: Referrals and Referral Tree menu items added to admin sidebar

### Admin Dashboard Bypass Authentication (December 2024)
The admin dashboard is now accessible without login for testing purposes. Fixed multiple redirect issues:

1. **Removed 401 Redirect**: Both `/lib/api-client.ts` and `/lib/api/client.ts` no longer auto-redirect to /login on 401 errors
2. **Added Providers Wrapper**: Admin layout now properly wraps children in Providers component for Zustand/React Query support
3. **Graceful Error Handling**: Dashboard page uses Promise.allSettled and shows placeholder data when API calls fail
4. **Fixed Multiple API Clients**: Consolidated imports to use the correct api-client across all admin pages

**Key Files Changed:**
- `frontend/src/lib/api-client.ts` - Disabled 401 redirect
- `frontend/src/lib/api/client.ts` - Disabled 401 redirect
- `frontend/src/app/admin/layout.tsx` - Added Providers wrapper
- `frontend/src/app/admin/dashboard/page.tsx` - Uses apiClient with error handling
- `frontend/src/app/(auth)/login/page.tsx` - Fixed import path

### Admin Dashboard Fix - Zustand Hydration Issue
The admin dashboard was failing with "getServerSnapshot should be cached" and hydration errors. Fixed by:

1. **Isolated Admin Routes**: Moved `Providers` and `MobileNav` from root `layout.tsx` to `(main)/layout.tsx` and `(auth)/layout.tsx`. Admin routes now bypass Zustand stores entirely.

2. **Store Updates**: 
   - Changed stores to use `createWithEqualityFn` from `zustand/traditional` with `shallow` equality
   - Added `skipHydration: true` to persist middleware config
   - Manual rehydration in `Providers` on client mount

3. **ThemeToggle**: Updated to use local state instead of uiStore to avoid SSR issues in admin section

**Key Files Changed:**
- `frontend/src/app/layout.tsx` - Removed Providers wrapper
- `frontend/src/app/(main)/layout.tsx` - Added Providers and MobileNav
- `frontend/src/app/(auth)/layout.tsx` - Added Providers
- `frontend/src/store/authStore.ts` - Using createWithEqualityFn + skipHydration
- `frontend/src/store/cartStore.ts` - Using createWithEqualityFn + skipHydration
- `frontend/src/components/theme/ThemeToggle.tsx` - Uses local state only

**Note:** WebSocket HMR errors in console are expected in Replit's proxy environment and don't affect functionality.

🚀 **Running Services:**
- **Frontend**: http://localhost:5000 (Next.js 16)
- **Backend API**: http://localhost:8000 (FastAPI)
- **API Docs**: http://localhost:8000/docs (Swagger UI)

📊 **Seeded Data:**
- 18 merchants (Amazon, Flipkart, Myntra, Swiggy, etc.)
- 54 coupon offers with real discount codes
- 15 gift cards with 109 price variants
- Admin user: admin@couponali.com / admin123

⚠️ **Optional Configuration (for production):**
- **Redis**: For production, set up Upstash for caching/rate limiting
- **Payment Gateway**: Configure Razorpay keys for payments
- **Email/SMS**: Enable for production with SendGrid/MSG91

## Setup Instructions

### Step 1: Create PostgreSQL Database

1. Open "All tools" menu in Replit workspace
2. Select "Database" (or search for "Replit Database")
3. Click "Create a database"
4. Once created, Replit will automatically set these environment variables:
   - `DATABASE_URL`
   - `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT`

### Step 2: Set Up Redis

**Option A: Use Upstash (Recommended for Replit)**
1. Search for "upstash" integration in Replit
2. Connect your Upstash account
3. Set `REDIS_URL` environment variable from Upstash

**Option B: Local Redis (if available)**
- Redis is currently not available in this environment
- If you enable it, set `REDIS_URL=redis://localhost:6379`

### Step 3: Run Database Migrations

Once PostgreSQL is set up, run:

```bash
cd backend
alembic upgrade head
```

This will create all the required tables and schema.

### Step 4: Optional - Seed Sample Data

To populate the database with sample merchants, offers, and products:

```bash
cd backend
python scripts/seed.py
```

### Step 5: Start Backend (After Database Setup)

Create a backend workflow or run manually:

```bash
cd backend
uvicorn app.main:app --host localhost --port 8000 --reload
```

## Environment Variables

### Frontend (.env.local or shared environment)
- `NEXT_PUBLIC_API_URL`: Backend API URL (currently set to Replit domain)

### Backend (.env or shared environment)
- `DATABASE_URL`: PostgreSQL connection string (auto-set by Replit)
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: JWT secret key (configured)
- `CORS_ORIGINS`: Frontend URLs (configured)
- `DEBUG`: True for development
- `SMS_ENABLED`: False (disable SMS in dev)
- `EMAIL_ENABLED`: False (disable email in dev)

### Optional Third-Party Services
- **Payment**: Razorpay keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
- **SMS**: MSG91 credentials (when SMS_ENABLED=True)
- **Email**: SendGrid API key (when EMAIL_ENABLED=True)
- **Affiliate Networks**: Admitad, VCommission, CueLinks credentials

## Project Structure

```
.
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/v1/      # API endpoints
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── main.py      # Application entry
│   ├── alembic/         # Database migrations
│   ├── requirements.txt # Python dependencies
│   └── .env.example     # Environment template
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/         # Next.js app router pages
│   │   ├── components/  # React components
│   │   ├── lib/         # API client, utilities
│   │   └── store/       # Zustand state management
│   └── package.json     # Node dependencies
├── services/            # Microservices
│   ├── redirector/      # Click tracking (Bun)
│   └── webhooks/        # Payment webhooks (Bun)
├── docs/                # Comprehensive documentation
└── deployment/          # Deployment configs
```

## Available Workflows

### Frontend (Active)
- **Command**: `cd frontend && npm run dev`
- **Port**: 5000 (webview)
- **Status**: Running
- **URL**: Available in webview pane

### Backend (To be configured)
Once database is set up, create a workflow:
- **Command**: `cd backend && uvicorn app.main:app --host localhost --port 8000 --reload`
- **Port**: 8000 (console - internal only)
- **Output**: Console logs

## API Documentation

Once backend is running:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

## Troubleshooting

### Frontend Issues
1. **API calls failing**: Backend is not running or DATABASE_URL not set
2. **Cross-origin errors**: Should be fixed with `allowedDevOrigins` in next.config.ts
3. **Port conflicts**: Frontend must run on 5000 for Replit webview

### Backend Issues
1. **Cannot connect to database**: Create database through Replit UI first
2. **Redis connection error**: Set up Redis/Upstash integration
3. **Import errors**: Ensure `pip install -r requirements.txt` completed
4. **Migration errors**: Database not created or wrong credentials

### Common Fixes
```bash
# Reinstall frontend dependencies
cd frontend && rm -rf node_modules && npm install

# Reinstall backend dependencies
cd backend && pip install -r requirements.txt

# Check environment variables
env | grep -E 'DATABASE_URL|REDIS_URL|NEXT_PUBLIC'

# View frontend logs
# Use the logs panel in Replit UI

# Test backend directly
cd backend && python -c "from app.main import app; print('OK')"
```

## Next Steps

1. ✅ Frontend is ready and running
2. ⬜ Create PostgreSQL database
3. ⬜ Set up Redis (Upstash recommended)
4. ⬜ Run database migrations
5. ⬜ Start backend server
6. ⬜ Test full stack integration
7. ⬜ Optional: Configure payment gateway (Razorpay)
8. ⬜ Optional: Set up email/SMS for production

## Deployment

When ready to deploy:

1. Configure deployment using Replit's deployment tool
2. Set deployment target to "autoscale" for frontend
3. Set deployment target to "vm" for backend (stateful)
4. Ensure production environment variables are set
5. Use separate production database credentials

## Documentation

Comprehensive guides available in `/docs/`:
- `00-QUICK-START.md` - Getting started guide
- `01-PROJECT-OVERVIEW.md` - Project vision and goals
- `02-DATABASE-SCHEMA.md` - Database structure
- `03-API-SPECIFICATION.md` - API endpoints
- `04-FRONTEND-ARCHITECTURE.md` - Frontend design
- `05-IMPLEMENTATION-ROADMAP.md` - Development roadmap

## Technical Notes

### Replit Proxy Configuration

The frontend is configured to work with Replit's preview proxy system. The `next.config.ts` file dynamically reads the `REPLIT_DEV_DOMAIN` or `REPLIT_DOMAINS` environment variable to set `allowedDevOrigins`. This ensures that the frontend works correctly even when the Replit workspace URL changes (after restarts, forks, or when accessed by collaborators).

If you encounter cross-origin errors after a workspace restart:
1. The environment variables should automatically update
2. Restart the Frontend workflow to pick up the new domain
3. The configuration will adapt to the new preview URL

## Recent Changes

**2025-11-29**: Initial Replit setup
- Installed all dependencies (Python, Node.js)
- Configured Next.js for Replit environment (port 5000, dynamic allowed origins from REPLIT_DEV_DOMAIN)
- Set up environment variables
- Created frontend workflow
- Ready for database setup
- Cross-origin warnings resolved with dynamic domain configuration

## User Preferences

- Development environment for testing the full stack
- Production deployment requires proper database, Redis, and third-party API keys

## Notes

- This is a comprehensive e-commerce platform with affiliate network integration
- Backend uses FastAPI with async support
- Frontend uses Next.js 16 App Router with server components
- Real-time features use WebSockets and Redis
- Payment integration via Razorpay (Indian market)
- Extensive admin panel for managing offers, orders, and users
