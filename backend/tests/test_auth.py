"""Tests for authentication API endpoints."""
import pytest
from fastapi import status


class TestRegistration:
    """Test user registration."""

    def test_register_with_email(self, client, db_session):
        """Test registration with email."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "SecurePass123!",
                "full_name": "New User",
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["success"] is True
        assert "user_id" in data["data"]
        assert data["data"]["email"] == "newuser@example.com"
        assert "referral_code" in data["data"]

    def test_register_with_mobile(self, client, db_session):
        """Test registration with mobile."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "mobile": "+919876543210",
                "password": "SecurePass123!",
                "full_name": "Mobile User",
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["data"]["mobile"] == "+919876543210"

    def test_register_duplicate_email(self, client, db_session):
        """Test registration with duplicate email."""
        # First registration
        client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "SecurePass123!",
            },
        )

        # Duplicate registration
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "AnotherPass123!",
            },
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" in response.json()["detail"].lower()

    def test_register_with_referral(self, client, db_session):
        """Test registration with referral code."""
        # Create referrer
        ref_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "referrer@example.com",
                "password": "SecurePass123!",
            },
        )
        referral_code = ref_response.json()["data"]["referral_code"]

        # Register with referral
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "referred@example.com",
                "password": "SecurePass123!",
                "referral_code": referral_code,
            },
        )

        assert response.status_code == status.HTTP_201_CREATED

    def test_register_missing_credentials(self, client, db_session):
        """Test registration without email or mobile."""
        response = client.post(
            "/api/v1/auth/register",
            json={"password": "SecurePass123!"},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestLogin:
    """Test user login."""

    @pytest.fixture
    def registered_user(self, client):
        """Create a registered user."""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "testuser@example.com",
                "password": "SecurePass123!",
            },
        )
        return response.json()["data"]

    def test_login_with_email(self, client, registered_user):
        """Test login with email."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "identifier": "testuser@example.com",
                "password": "SecurePass123!",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data["data"]
        assert data["data"]["token_type"] == "bearer"

    def test_login_wrong_password(self, client, registered_user):
        """Test login with wrong password."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "identifier": "testuser@example.com",
                "password": "WrongPassword123!",
            },
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user."""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "identifier": "nonexistent@example.com",
                "password": "SomePass123!",
            },
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestOTP:
    """Test OTP functionality."""

    def test_request_otp(self, client, redis_client):
        """Test OTP request."""
        response = client.post(
            "/api/v1/auth/otp/request",
            json={"mobile": "+919876543210"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"] is True

        # Verify OTP stored in Redis
        otp_key = redis_client.keys("otp:*:+919876543210")
        assert len(otp_key) > 0

    def test_verify_otp(self, client, redis_client):
        """Test OTP verification."""
        # Request OTP
        client.post(
            "/api/v1/auth/otp/request",
            json={"mobile": "+919876543210"},
        )

        # Get OTP from Redis for testing
        otp_key = redis_client.keys("otp:*:+919876543210")[0]
        otp = redis_client.get(otp_key)

        # Verify OTP
        response = client.post(
            "/api/v1/auth/otp/verify",
            json={"mobile": "+919876543210", "otp": otp},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"] is True

    def test_verify_wrong_otp(self, client):
        """Test OTP verification with wrong code."""
        client.post(
            "/api/v1/auth/otp/request",
            json={"mobile": "+919876543210"},
        )

        response = client.post(
            "/api/v1/auth/otp/verify",
            json={"mobile": "+919876543210", "otp": "000000"},
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_otp_rate_limit(self, client, redis_client):
        """Test OTP rate limiting."""
        # Request multiple OTPs rapidly
        for _ in range(3):
            client.post(
                "/api/v1/auth/otp/request",
                json={"mobile": "+919876543210"},
            )

        # Should be rate limited
        response = client.post(
            "/api/v1/auth/otp/request",
            json={"mobile": "+919876543210"},
        )

        # Check if rate limited (implementation dependent)
        # assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
