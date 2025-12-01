# Load Testing Plan (Locust / k6)

## Scope
- Checkout flow (cart validate → create order → verify payment)
- Offer click redirect (redirector service)
- Search and listing pages (offers, products, merchants)
- Wallet endpoints (balance + transactions)

## Locust (Python)
Example `locustfile.py`:
```python
from locust import HttpUser, task, between

API = "http://localhost:8000/api/v1"

class CheckoutUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def checkout_flow(self):
        self.client.post(f"{API}/cart/validate", json={"items": [{"variant_id": 1, "quantity": 1}]})
        resp = self.client.post(f"{API}/checkout/create-order", json={
            "items": [{"variant_id": 1, "quantity": 1}],
            "delivery_email": "loadtest@example.com",
            "delivery_mobile": "+911234567890"
        })
        if resp.ok:
            order = resp.json()["data"]
            self.client.post(f"{API}/checkout/verify-payment", json={
                "order_id": order["order_id"],
                "razorpay_order_id": order["payment_details"]["order_id"],
                "razorpay_payment_id": "pay_mock",
                "razorpay_signature": "sig_mock"
            })
```

Run:
```bash
locust -f locustfile.py --host http://localhost:8000
```

## k6 (JavaScript)
`checkout.js`:
```js
import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  vus: 50,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const validate = http.post('http://localhost:8000/api/v1/cart/validate', JSON.stringify({
    items: [{ variant_id: 1, quantity: 1 }]
  }), { headers: { 'Content-Type': 'application/json' } });

  check(validate, { 'validate ok': (r) => r.status === 200 });

  const order = http.post('http://localhost:8000/api/v1/checkout/create-order', JSON.stringify({
    items: [{ variant_id: 1, quantity: 1 }],
    delivery_email: 'k6@example.com',
    delivery_mobile: '+911234567890'
  }), { headers: { 'Content-Type': 'application/json' } });

  if (order.status === 201) {
    const data = order.json().data;
    http.post('http://localhost:8000/api/v1/checkout/verify-payment', JSON.stringify({
      order_id: data.order_id,
      razorpay_order_id: data.payment_details.order_id,
      razorpay_payment_id: 'pay_mock',
      razorpay_signature: 'sig_mock'
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  sleep(1);
}
```

Run:
```bash
k6 run checkout.js
```

## Metrics & Targets
- p95 latency: < 800ms for API endpoints
- Error rate: < 1%
- Concurrency: 50–200 VUs for k6; 100–300 users for Locust depending on environment

## Environment
- Use staging with production-like data and feature flags.
- Ensure Redis/DB are sized appropriately; monitor CPU/memory.

## Monitoring
- Capture metrics via Prometheus/Grafana (see deployment/monitoring).
- Check Redis stats, DB connections, and Nginx upstream errors.
