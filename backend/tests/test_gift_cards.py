"""Tests for gift card automation endpoints."""
from fastapi import status
from app.redis_client import redis_client, rk


def _auth_headers(client):
    # Create admin user (simplified: register then treat as admin via override or assume require_admin stub passes)
    # If require_admin enforces role, this test may need adjustment.
    return {}


def test_auto_generate_gift_cards(client, db_session):
    resp = client.post("/api/v1/gift-cards/auto-generate", json={"count": 3, "value": 500})
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert len(data) == 3
    codes = {gc["code"] for gc in data}
    assert len(codes) == 3  # uniqueness


def test_bulk_import_and_assign_deliver(client):
    csv_content = "CARD1,250\nCARD2,300\nCARD3,350\n"
    resp = client.post(
        "/api/v1/gift-cards/import",
        files={"file": ("cards.csv", csv_content, "text/csv")},
        data={"default_value": 200},
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.json()["imported"] == 3

    # List to fetch an ID
    list_resp = client.get("/api/v1/gift-cards/")
    assert list_resp.status_code == status.HTTP_200_OK
    gift_cards = list_resp.json()
    target = gift_cards[0]

    # Assign & deliver
    deliver = client.post(f"/api/v1/gift-cards/{target['id']}/assign-deliver", json={"user_id": 999})
    assert deliver.status_code == status.HTTP_200_OK
    delivered = deliver.json()
    assert delivered["user_id"] == 999

    # Email job enqueued
    email_queue_key = rk("queue", "email")
    assert redis_client.llen(email_queue_key) >= 1
