"""Cashback lifecycle tests."""
from fastapi.testclient import TestClient
from app.dependencies import get_current_user, require_admin
from app.models import CashbackEvent
from app.tests.factories import create_user


def test_cashback_create_and_list(client: TestClient, db_session):
    # Override auth dependencies
    user = create_user(db_session, "cashback@example.com", is_admin=True)

    def _admin():
        return user

    client.app.dependency_overrides[require_admin] = _admin
    client.app.dependency_overrides[get_current_user] = _admin

    payload = {
        "user_id": user.id,
        "offer_id": 1,
        "click_id": "click-123",
        "merchant_id": 1,
        "transaction_amount": 500.0,
        "commission_amount": 25.0,
        "cashback_amount": 15.0,
        "status": "pending",
        "affiliate_transaction_id": "aff-1",
    }
    resp = client.post("/api/v1/cashback/events", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["cashback_amount"] == payload["cashback_amount"]

    # Should appear in admin list
    admin_list = client.get("/api/v1/cashback/events")
    assert admin_list.status_code == 200
    assert len(admin_list.json()) >= 1

    # Should appear for current user
    mine = client.get("/api/v1/cashback/my")
    assert mine.status_code == 200
    assert any(ev["affiliate_transaction_id"] == "aff-1" for ev in mine.json())

    # Cleanup overrides
    client.app.dependency_overrides.clear()
