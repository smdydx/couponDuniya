"""Test configuration and fixtures."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import redis
from app.redis_client import rk

from app.main import app
from app.database import Base, get_db
from app.config import get_settings

settings = get_settings()

# Test database: attempt Postgres, fallback to SQLite for local/dev environments without Postgres
POSTGRES_TEST_URL = "postgresql://postgres:postgres@localhost:5432/coupon_commerce_test"
engine = None
try:
    engine = create_engine(POSTGRES_TEST_URL)
    # Probe connection early to trigger fallback if unreachable
    with engine.connect() as _conn:  # noqa: F841
        pass
except OperationalError:
    SQLITE_TEST_URL = "sqlite:///./test.db"
    engine = create_engine(SQLITE_TEST_URL, connect_args={"check_same_thread": False})
    print("[tests] Using SQLite fallback for tests (Postgres unavailable)")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def test_db():
    """Create test database tables."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(test_db):
    """Create a new database session for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Create test client with database session override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def redis_client():
    """Redis client using same DB as application; isolate queue keys each test."""
    r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    # Pre-test cleanup of queue keys
    for key in list(r.scan_iter(match=rk("queue", "*"))):
        r.delete(key)
    yield r
    # Post-test cleanup
    for key in list(r.scan_iter(match=rk("queue", "*"))):
        r.delete(key)
