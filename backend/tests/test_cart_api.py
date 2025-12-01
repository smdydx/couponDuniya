"""Tests for cart Redis persistence APIs."""
from fastapi.testclient import TestClient
from app.tests.factories import create_user
from app.dependencies import get_current_user


def test_cart_add_update_remove(client: TestClient, db_session):
    user = create_user(db_session, "cartuser@example.com", is_admin=False)

    def _user():
        return user

    client.app.dependency_overrides[get_current_user] = _user

    # Add item
    resp = client.post("/api/v1/cart/add", json={"variant_id": 10, "quantity": 2, "product_id": 5})
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["items"][0]["quantity"] == 2

    # Update quantity
    resp = client.post("/api/v1/cart/update", json={"variant_id": 10, "quantity": 5})
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["items"][0]["quantity"] == 5

    # Remove
    resp = client.post("/api/v1/cart/remove", json={"variant_id": 10})
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["items"] == []

    client.app.dependency_overrides.clear()
