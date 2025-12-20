# ⚡ Quick Command Reference

## 🚀 Start Development Servers

### All Services (Different Terminals)

**Terminal 1 - Backend API**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger)
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm run dev
# → http://localhost:3000
```

**Terminal 3 - Redirector Service**
```bash
cd services/redirector
bun run dev
# → http://localhost:3001
```

**Terminal 4 - Webhooks Service**
```bash
cd services/webhooks
bun run dev
# → http://localhost:3002
```

---

## 📦 Package Management

### Backend (Python)
```bash
# Install package
pip install package_name

# Update requirements.txt
pip freeze > requirements.txt

# Install from requirements
pip install -r requirements.txt
```

### Frontend (Node.js)
```bash
# Install package
npm install package_name

# Install dev dependency
npm install -D package_name

# Update packages
npm update
```

### Services (Bun)
```bash
# Install package
bun add package_name

# Install dev dependency
bun add -d package_name

# Update packages
bun update
```

---

## 🗄️ Database Commands

### PostgreSQL
```bash
# Connect to database
psql -U postgres -d coupon_commerce

# List all databases
psql -U postgres -c "\l"

# Run SQL file
psql -U postgres -d coupon_commerce -f schema.sql

# Backup database
pg_dump -U postgres coupon_commerce > backup.sql

# Restore database
psql -U postgres -d coupon_commerce < backup.sql
```

### Inside psql
```sql
-- List tables
\dt

-- Describe table
\d users

-- View data
SELECT * FROM users LIMIT 10;

-- Exit
\q
```

### Alembic (Migrations)
```bash
cd backend

# Create migration
alembic revision --autogenerate -m "add users table"

# Run migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history
```

---

## 📝 Redis Commands

### CLI
```bash
# Connect
redis-cli

# Test connection
redis-cli PING

# Get all keys
redis-cli KEYS "*"

# Get value
redis-cli GET key_name

# Set value with expiry (seconds)
redis-cli SETEX key_name 300 "value"

# Delete key
redis-cli DEL key_name

# Flush all data (⚠️ Development only!)
redis-cli FLUSHALL

# Monitor all commands
redis-cli MONITOR
```

### Inside redis-cli
```
# View all keys
KEYS *

# Get OTP for mobile
GET otp:+919876543210

# Check TTL (time to live)
TTL otp:+919876543210

# View offer clicks
GET offer:123:clicks

# Exit
quit
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

### Frontend Tests
```bash
cd frontend

# Run tests (if configured)
npm test

# Run in watch mode
npm test -- --watch
```

---

## 🎨 Code Formatting

### Backend
```bash
cd backend
source venv/bin/activate

# Format with Black
black app/

# Check style with Flake8
flake8 app/

# Fix imports
isort app/
```

### Frontend
```bash
cd frontend

# Format with Prettier (if installed)
npm run format

# Lint with ESLint
npm run lint

# Fix lint issues
npm run lint -- --fix
```

---

## 🔍 Debugging

### Backend Logs
```bash
# View uvicorn logs
uvicorn app.main:app --reload --log-level debug

# Python debug mode
python -m pdb app/main.py
```

### Frontend Logs
```bash
# Development server logs
npm run dev

# Build logs
npm run build
```

### Services Logs
```bash
# Redirector with logs
cd services/redirector
bun run dev

# Webhooks with logs
cd services/webhooks
bun run dev
```

---

## 🌐 API Testing

### curl Examples

**Request OTP**
```bash
curl -X POST http://localhost:8000/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+919876543210"}'
```

**Login**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "+919876543210", "password": "test123"}'
```

**Protected Route (with token)**
```bash
curl http://localhost:8000/api/v1/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### HTTPie (Alternative)
```bash
# Install
brew install httpie

# Request OTP
http POST http://localhost:8000/api/v1/auth/request-otp mobile="+919876543210"

# Login
http POST http://localhost:8000/api/v1/auth/login mobile="+919876543210" password="test123"
```

---

## 🛠️ Common Tasks

### Create New API Endpoint
```bash
cd backend/app/api/v1
touch merchants.py  # Create new route file
# Add router to app/main.py
```

### Create New Frontend Page
```bash
cd frontend/app
mkdir merchants
touch merchants/page.tsx
```

### Add Database Table
```bash
cd backend
# 1. Update models/your_model.py
# 2. Create migration
alembic revision --autogenerate -m "add your_table"
# 3. Apply migration
alembic upgrade head
```

### Install shadcn/ui Component
```bash
cd frontend
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

---

## 🔧 Environment Setup

### Copy Environment Files
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.local.example frontend/.env.local

# Redirector
cp services/redirector/.env.example services/redirector/.env

# Webhooks
cp services/webhooks/.env.example services/webhooks/.env
```

### Generate Secret Keys
```bash
# Python (for JWT secrets)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -hex 32
```

---

## 📊 Monitoring

### Check Service Health
```bash
# Backend
curl http://localhost:8000/health

# Redirector
curl http://localhost:3001/health

# Webhooks
curl http://localhost:3002/health
```

### Database Connection Count
```sql
SELECT count(*) FROM pg_stat_activity 
WHERE datname = 'coupon_commerce';
```

### Redis Memory Usage
```bash
redis-cli INFO memory
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -ti:8000

# Kill process
kill -9 $(lsof -ti:8000)

# Or for frontend (3000)
kill -9 $(lsof -ti:3000)
```

### PostgreSQL Won't Start
```bash
# Check status
pg_ctl status

# Restart
pg_ctl restart
```

### Redis Connection Error
```bash
# Check if running
redis-cli ping

# Start service
brew services start redis

# Restart service
brew services restart redis
```

### Python Package Conflicts
```bash
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Node Modules Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📖 Documentation

### View Docs
```bash
# API documentation
open http://localhost:8000/docs

# ReDoc alternative
open http://localhost:8000/redoc

# Project README
cat README.md

# Implementation guide
cat docs/05-IMPLEMENTATION-ROADMAP.md
```

---

## 🎯 Daily Workflow

```bash
# 1. Start databases
brew services start postgresql
brew services start redis

# 2. Start backend (Terminal 1)
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# 3. Start frontend (Terminal 2)
cd frontend && npm run dev

# 4. Work on features
# - Create models
# - Create API endpoints
# - Create frontend pages
# - Test with curl or Postman

# 5. Commit changes
git add .
git commit -m "Add feature: description"
git push
```

---

## 🔗 Useful URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Redirector | http://localhost:3001 |
| Webhooks | http://localhost:3002 |

---

Save this for quick reference! 📌
