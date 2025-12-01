import json
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine, Base
from app.models import User, GiftCard
import uuid

client = TestClient(app)

# Ensure tables exist for sqlite ephemeral test DB
Base.metadata.create_all(bind=engine)

def create_admin_user(db):
    unique_email = f"admin_{uuid.uuid4().hex[:8]}@example.com"
    unique_ref = f"ADMIN{uuid.uuid4().hex[:6]}"
    u = User(email=unique_email, full_name="Admin", password_hash="x", referral_code=unique_ref, is_admin=True)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

def create_user(db):
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    unique_ref = f"REF{uuid.uuid4().hex[:6]}"
    u = User(email=unique_email, full_name="User One", password_hash="x", referral_code=unique_ref)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

def create_gift_card(db):
    gc = GiftCard(code="TEST-GC-1", initial_value=100.0, remaining_value=100.0)
    db.add(gc)
    db.commit()
    db.refresh(gc)
    return gc

def test_gift_card_assign_deliver_enqueues_email(monkeypatch):
    # Fresh schema per test to avoid uniqueness collisions
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    # Collect pushed jobs
    pushed = []
    def fake_rpush(key, value):
        pushed.append((key, value))
    from app.queue import redis_client, EMAIL_QUEUE
    monkeypatch.setattr(redis_client, "rpush", fake_rpush)

    db = SessionLocal()
    user = create_user(db)
    admin = create_admin_user(db)
    gc = create_gift_card(db)

    # Fake admin auth header
    headers = {"Authorization": "Bearer faketoken"}
    resp = client.post(f"/api/v1/gift-cards/{gc.id}/assign-deliver", json={"user_id": user.id}, headers=headers)
    assert resp.status_code == 200

    # Ensure an email job was enqueued with correct recipient
    assert pushed, "No email job enqueued"
    found = False
    for key, raw in pushed:
        if key == EMAIL_QUEUE:
            data = json.loads(raw)
            if data.get("type") == "gift_card_delivery" and data.get("to") == user.email:
                found = True
                assert data["data"]["code"] == gc.code
                break
    assert found, "Gift card delivery email job with correct user not found"
    db.close()
