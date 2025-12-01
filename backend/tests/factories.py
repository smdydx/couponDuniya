"""Lightweight test data factories for merchants, offers, products, clicks, views."""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import Merchant, Offer, Product, OfferClick, OfferView, User
from app.security import get_password_hash
import uuid

def create_user(db: Session, email: str | None = None, is_admin: bool = False) -> User:
    u = User(
        email=email,
        full_name=email.split('@')[0] if email else f"User{uuid.uuid4().hex[:6]}",
        password_hash=get_password_hash("TestPass123!"),
        referral_code=f"REF{uuid.uuid4().hex[:6].upper()}",
        is_active=True,
        is_admin=is_admin,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

def create_merchant(db: Session, name: str) -> Merchant:
    m = Merchant(
        name=name,
        slug=name.lower().replace(" ", "-") + "-" + uuid.uuid4().hex[:4],
        description=f"{name} description",
        is_active=True,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

def create_offer(db: Session, merchant: Merchant, title: str, active: bool = True, expires_in_days: int | None = None) -> Offer:
    now = datetime.utcnow()
    ends_at = now + timedelta(days=expires_in_days) if expires_in_days is not None else None
    o = Offer(
        merchant_id=merchant.id,
        title=title,
        code=None,
        is_active=active,
        priority=0,
        starts_at=now - timedelta(days=1),
        ends_at=ends_at,
    )
    db.add(o)
    db.commit()
    db.refresh(o)
    return o

def create_product(db: Session, merchant: Merchant, name: str) -> Product:
    p = Product(
        merchant_id=merchant.id,
        name=name,
        slug=name.lower().replace(" ", "-") + "-" + uuid.uuid4().hex[:4],
        price=199.00,
        stock=10,
        is_active=True,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

def add_offer_views(db: Session, offer: Offer, count: int, user: User | None = None):
    for _ in range(count):
        db.add(OfferView(offer_id=offer.id, user_id=user.id if user else None))
    db.commit()

def add_offer_clicks(db: Session, offer: Offer, count: int, user: User | None = None):
    for _ in range(count):
        db.add(OfferClick(offer_id=offer.id, user_id=user.id if user else None))
    db.commit()
