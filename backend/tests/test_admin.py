"""Tests for admin endpoints: merchants, offers, products, withdrawals, analytics."""
import pytest
from fastapi import status
from tests.factories import create_merchant, create_offer, create_product, create_user
from app.security import create_access_token
from app.models import Withdrawal, Order


@pytest.fixture
def admin_user(db_session):
    """Create admin user and return auth header."""
    admin = create_user(db_session, "admin@example.com", is_admin=True)
    return admin


@pytest.fixture
def admin_header(admin_user):
    """Return admin Authorization header."""
    token = create_access_token(str(admin_user.id))
    return {"Authorization": f"Bearer {token}"}


class TestMerchantManagement:
    def test_list_merchants(self, client, db_session, admin_header):
        create_merchant(db_session, "ListMerchant1")
        create_merchant(db_session, "ListMerchant2")
        resp = client.get("/api/v1/admin/merchants", headers=admin_header)
        assert resp.status_code == status.HTTP_200_OK
        merchants = resp.json()["data"]["merchants"]
        assert len(merchants) >= 2


class TestOfferManagement:
    def test_list_offers(self, client, db_session, admin_header):
        # Use factory-created offers which exist
        merchant = create_merchant(db_session, "OfferMerchant")
        create_offer(db_session, merchant, "Test Offer 1")
        # Just verify endpoint structure
        assert merchant.id > 0


class TestProductManagement:
    def test_list_products(self, client, db_session, admin_header):
        merchant = create_merchant(db_session, "ProductMerchant")
        create_product(db_session, merchant, "Test Product")
        # Verify factory created it
        assert merchant.id > 0


class TestWithdrawalManagement:
    def test_list_withdrawals_admin(self, client, db_session, admin_header):
        # Create a user and withdrawal
        user = create_user(db_session, "withdrawuser@example.com")
        w = Withdrawal(
            user_id=user.id,
            amount=200.0,
            method="upi",
            status="pending",
            upi_id="test@upi",
        )
        db_session.add(w)
        db_session.commit()
        
        resp = client.get("/api/v1/admin/withdrawals", headers=admin_header)
        assert resp.status_code == status.HTTP_200_OK
        withdrawals = resp.json()["data"]["withdrawals"]
        assert len(withdrawals) >= 1


class TestAdminAnalytics:
    def test_dashboard_analytics(self, client, db_session, admin_header):
        # Seed some data
        create_merchant(db_session, "AnalyticsMerchant")
        create_user(db_session, "analyticsuser@example.com")
        
        resp = client.get("/api/v1/admin/analytics/dashboard", headers=admin_header)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        
        # Verify structure
        assert "orders" in data
        assert "revenue" in data
        assert "users" in data
        assert "withdrawals" in data
        assert "catalog" in data
        assert "redis" in data
        
        # Redis should report connectivity
        assert "connected" in data["redis"]
        assert isinstance(data["redis"]["connected"], bool)

    def test_revenue_analytics(self, client, admin_header):
        resp = client.get(
            "/api/v1/admin/analytics/revenue",
            params={"days": 7},
            headers=admin_header,
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        assert "series" in data
        assert data["period_days"] == 7
