# BIDUA Coupon Commerce - Replit Setup

## Project Overview

This is a full-stack e-commerce platform for coupons, cashback offers, and gift cards. The project is a GitHub import that has been configured to run in the Replit environment.

**Architecture:**
- **Frontend**: Next.js 16 + React 19 + TypeScript (Port 5000)
- **Backend**: FastAPI + Python 3.12 (Port 8000 - to be configured)
- **Database**: PostgreSQL (via Replit Database)
- **Cache**: Redis (required for sessions, rate limiting)
- **Additional Services**: Bun-based microservices (redirector, webhooks)

## Current Status

✅ **Completed:**
- Python dependencies installed
- Node.js dependencies installed (using Bun)
- Frontend workflow configured and running on port 5000
- Backend workflow configured and running on port 8000
- PostgreSQL database created and configured
- Database migrations completed
- Environment variables configured
- Next.js configured for Replit proxy (0.0.0.0:5000 with allowed dev origins)
- Redis gracefully mocked for development (app works without Redis)
- Git ignore file created

🚀 **Running Services:**
- **Frontend**: http://localhost:5000 (Next.js 16)
- **Backend API**: http://localhost:8000 (FastAPI)
- **API Docs**: http://localhost:8000/docs (Swagger UI)

⚠️ **Optional Configuration:**
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
