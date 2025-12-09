from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import get_settings

settings = get_settings()

# Use psycopg (version 3) instead of psycopg2
# The DATABASE_URL should use postgresql+psycopg:// instead of postgresql://
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Configure engine based on database type
if database_url.startswith("sqlite"):
    engine = create_engine(
        database_url, 
        echo=settings.DEBUG, 
        connect_args={"check_same_thread": False}
    )
else:
    # Production-optimized PostgreSQL connection pool
    pool_size = 20 if settings.APP_ENV == 'production' else 5
    max_overflow = 40 if settings.APP_ENV == 'production' else 10
    
    engine = create_engine(
        database_url, 
        echo=settings.DEBUG, 
        pool_pre_ping=True,
        pool_size=pool_size,
        max_overflow=max_overflow,
        pool_recycle=3600,  # Recycle connections after 1 hour
        pool_timeout=30,
        connect_args={
            "connect_timeout": 10,
            "application_name": settings.APP_NAME
        }
    )

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()