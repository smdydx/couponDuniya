"""Tests for search-related endpoints: search, autocomplete, trending, expiring, recommendations."""
import pytest
from fastapi import status
from sqlalchemy import select
from tests.factories import (
    create_merchant,
    create_offer,
    create_product,
    create_user,
    add_offer_views,
    add_offer_clicks,
)


@pytest.fixture
def ensure_postgres(db_session):
    # Skip if not using Postgres (search uses ts_rank, etc.)
    if db_session.bind.dialect.name != "postgresql":
        pytest.skip("Postgres required for full-text search tests")


@pytest.fixture
def search_seed(db_session, ensure_postgres):
    merchant = create_merchant(db_session, "Alpha Store")
    offer = create_offer(db_session, merchant, "Alpha Discount 20%", active=True)
    product = create_product(db_session, merchant, "Alpha Gadget")
    return {"merchant": merchant, "offer": offer, "product": product}


class TestUniversalSearch:
    def test_search_all_entities(self, client, db_session, search_seed):
        resp = client.get("/api/v1/search/", params={"q": "Alpha"})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]["results"]
        types = {r["type"] for r in data}
        assert {"merchant", "offer", "product"}.issubset(types)


class TestAutocomplete:
    def test_autocomplete_basic(self, client, db_session, search_seed):
        resp = client.get("/api/v1/search/autocomplete", params={"q": "Al"})
        assert resp.status_code == status.HTTP_200_OK
        suggestions = resp.json()["data"]["suggestions"]
        assert any(s["text"].startswith("Alpha") for s in suggestions)


class TestTrendingOffers:
    def test_trending_offers(self, client, db_session, search_seed):
        offer = search_seed["offer"]
        # Add views and clicks (>=5 views per logic)
        add_offer_views(db_session, offer, 6)
        add_offer_clicks(db_session, offer, 3)
        resp = client.get("/api/v1/search/trending")
        assert resp.status_code == status.HTTP_200_OK
        offers = resp.json()["data"]["offers"]
        assert len(offers) >= 1
        assert offers[0]["stats"]["views"] >= 5


class TestExpiringOffers:
    def test_expiring_soon(self, client, db_session, ensure_postgres):
        m = create_merchant(db_session, "ExpireMart")
        # Create offer expiring in 2 days
        o = create_offer(db_session, m, "Soon Deal", active=True, expires_in_days=2)
        resp = client.get("/api/v1/search/expiring-soon", params={"days": 7})
        assert resp.status_code == status.HTTP_200_OK
        offers = resp.json()["data"]["offers"]
        assert any(ofr["id"] == o.id for ofr in offers)


class TestRecommendations:
    def test_recommendations_anonymous(self, client, db_session, search_seed):
        resp = client.get("/api/v1/search/recommendations")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        assert data["personalized"] is False
        assert len(data["offers"]) > 0

    def test_recommendations_personalized(self, client, db_session, ensure_postgres):
        user = create_user(db_session, "recuser@example.com")
        m = create_merchant(db_session, "RecoMart")
        o1 = create_offer(db_session, m, "Reco Deal 1", active=True)
        o2 = create_offer(db_session, m, "Reco Deal 2", active=True)
        # Simulate clicks by user to seed history
        add_offer_clicks(db_session, o1, 2, user=user)
        resp = client.get("/api/v1/search/recommendations", params={"user_id": user.id})
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        assert data["personalized"] is True
        offer_ids = {ofr["id"] for ofr in data["offers"]}
        assert o1.id in offer_ids or o2.id in offer_ids
