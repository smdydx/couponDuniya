# Coupon Commerce - Backend API

FastAPI backend with Elesiya framework for coupon aggregation and gift card e-commerce platform.

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Authentication**: JWT with Redis sessions

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration settings
│   ├── database.py             # Database connection
│   ├── redis_client.py         # Redis connection
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── merchant.py
│   │   ├── offer.py
│   │   ├── product.py
│   │   ├── order.py
│   │   └── wallet.py
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── auth.py
│   │   ├── merchant.py
│   │   └── offer.py
│   ├── api/                    # API routes
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── merchants.py
│   │   │   ├── offers.py
│   │   │   ├── products.py
│   │   │   ├── orders.py
│   │   │   ├── wallet.py
│   │   │   └── admin.py
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── offer_service.py
│   │   ├── order_service.py
│   │   └── wallet_service.py
│   ├── utils/                  # Utilities
│   │   ├── __init__.py
│   │   ├── security.py         # Password hashing, JWT
│   │   ├── sms.py             # MSG91 integration
│   │   └── email.py           # SendGrid integration
│   └── middleware/             # Custom middleware
│       ├── __init__.py
│       ├── auth.py
│       └── rate_limit.py
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
├── tests/                      # Unit & integration tests
│   ├── __init__.py
│   ├── test_auth.py
│   └── test_offers.py
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
└── README.md
```

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Run Database Migrations

```bash
alembic upgrade head
```

### 5. Start Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at: `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## Environment Variables

See `.env.example` for required configuration:
- Database connection (PostgreSQL)
- Redis connection
- JWT secret key
- SMS API credentials (MSG91)
- Email API credentials (SendGrid)
- Payment gateway (Razorpay)

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Development

```bash
# Run tests
pytest

# Check code style
black app/
flake8 app/

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head
```
