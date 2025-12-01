"""Integration tests for checkout/cart flow and payment webhook stubs."""
import pytest
from fastapi.testclient import TestClient


class TestCheckoutFlow:
    def test_cart_validate(self, client: TestClient):
        payload = {
            "items": [
                {"variant_id": 1, "quantity": 2},
                {"variant_id": 5, "quantity": 1},
            ],
            "promo_code": "WELCOME10",
        }
        resp = client.post("/api/v1/cart/validate", json=payload)
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert len(data["items"]) == 2
        assert data["total"] <= data["subtotal"]

    def test_create_order_and_verify_payment(self, client: TestClient):
        payload = {
            "items": [{"variant_id": 1, "quantity": 1}],
            "delivery_email": "user@example.com",
            "delivery_mobile": "+911234567890",
            "promo_code": "WELCOME10",
            "use_wallet_balance": True,
            "wallet_amount": 100,
        }
        resp = client.post("/api/v1/checkout/create-order", json=payload)
        assert resp.status_code == 201
        data = resp.json()["data"]
        assert data["order_id"]
        assert data["payment_details"]["gateway"] == "razorpay"

        verify_payload = {
            "order_id": data["order_id"],
            "razorpay_order_id": data["payment_details"]["order_id"],
            "razorpay_payment_id": "pay_mock",
            "razorpay_signature": "sig_mock",
        }
        verify = client.post("/api/v1/checkout/verify-payment", json=verify_payload)
        assert verify.status_code == 200
        verify_data = verify.json()["data"]
        assert verify_data["payment_verified"] is True
        assert verify_data["order_status"] == "paid"

    def test_payment_webhook_stub(self, client: TestClient):
        resp = client.post("/api/v1/checkout/payment-webhook", json={"payload": "mock"})
        assert resp.status_code == 204
