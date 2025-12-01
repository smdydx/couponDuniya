import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid
from app.database import SessionLocal
from app.models import AffiliateMerchantMap, AffiliateClick, AffiliateTransaction, CashbackEvent, Merchant, User
from sqlalchemy.orm import Session

client = TestClient(app)

@pytest.fixture
def db_session() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def seed_entities(db_session: Session):
    # Create user and merchant
    suffix = uuid.uuid4().hex[:6]
    user = User(email=f"affuser-{suffix}@example.com", password_hash="x", is_active=True)
    suffix2 = uuid.uuid4().hex[:6]
    merchant = Merchant(name=f"Aff Merchant {suffix2}", slug=f"aff-merchant-{suffix2}")
    db_session.add(user)
    db_session.add(merchant)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(merchant)
    # Map external merchant id
    m_map = AffiliateMerchantMap(network="admitad", external_merchant_id="EXTM1", merchant_id=merchant.id)
    db_session.add(m_map)
    # Click
    click_ext = f"CLICK-{uuid.uuid4().hex[:8]}"
    click = AffiliateClick(user_id=user.id, merchant_id=merchant.id, network="admitad", external_click_id=click_ext)
    db_session.add(click)
    db_session.commit()
    return {"user": user, "merchant": merchant, "click": click}

def test_affiliate_sync_imports_transactions(db_session: Session, seed_entities, monkeypatch):
    # Monkeypatch fetch_all to return deterministic data
    from app.tasks import affiliate_sync
    tx_id = f"TX{uuid.uuid4().hex[:8]}"

    async def fake_fetch_all():
        return [
            ("admitad", {
                "external_id": tx_id,
                "status": "approved",
                "amount": 42.5,
                "merchant_ext_id": "EXTM1",
                "click_ext_id": seed_entities["click"].external_click_id,
            })
        ]

    monkeypatch.setattr(affiliate_sync, "fetch_all", fake_fetch_all)

    resp = client.post("/api/v1/affiliate/sync")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["imported"] == 1

    tx = db_session.query(AffiliateTransaction).filter_by(external_transaction_id=tx_id).first()
    assert tx is not None
    assert tx.user_id == seed_entities["user"].id
    assert tx.merchant_id == seed_entities["merchant"].id
    assert tx.status == "confirmed"  # approved mapped to confirmed

    cashback = (
        db_session.query(CashbackEvent)
        .filter(CashbackEvent.user_id == seed_entities["user"].id, CashbackEvent.amount == 42.5)
        .order_by(CashbackEvent.id.desc())
        .first()
    )
    assert cashback is not None
    assert cashback.user_id == seed_entities["user"].id
