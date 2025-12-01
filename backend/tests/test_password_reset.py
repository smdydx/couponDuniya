"""Tests for password reset flow."""
from fastapi import status
from app.redis_client import rk


def test_password_reset_request_nonexistent_email(client):
    response = client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": "nope@example.com"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["success"] is True
    assert "link was sent" in data["message"].lower()


def test_password_reset_flow(client, redis_client):
    # Register user
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "resetuser@example.com", "password": "OldPass123!"},
    )
    assert reg.status_code == status.HTTP_201_CREATED
    user_id = reg.json()["data"]["user_id"]

    # Request reset
    req = client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": "resetuser@example.com"},
    )
    assert req.status_code == status.HTTP_200_OK

    # Fetch token from Redis (pattern pwdreset:*)
    tokens = list(redis_client.scan_iter(match=rk("pwdreset", "*")))
    assert tokens, "Reset token not stored in Redis"
    key = tokens[0]
    token = key.split(":")[-1]

    # Confirm reset with new password
    conf = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": token, "new_password": "NewSecurePass987!"},
    )
    assert conf.status_code == status.HTTP_200_OK
    assert conf.json()["message"].lower().startswith("password updated")

    # Token should be invalidated
    assert redis_client.get(key) is None

    # Login with new password should succeed
    login = client.post(
        "/api/v1/auth/login",
        json={"identifier": "resetuser@example.com", "password": "NewSecurePass987!"},
    )
    assert login.status_code == status.HTTP_200_OK
    assert "access_token" in login.json()["data"]

    # Old password should fail
    old_login = client.post(
        "/api/v1/auth/login",
        json={"identifier": "resetuser@example.com", "password": "OldPass123!"},
    )
    assert old_login.status_code == status.HTTP_401_UNAUTHORIZED


def test_password_reset_invalid_token(client):
    conf = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": "badtoken123", "new_password": "SomeGoodPass123!"},
    )
    assert conf.status_code == status.HTTP_400_BAD_REQUEST
