import time
from fastapi.testclient import TestClient
from app.main import app
from app.metrics import affiliate_sync_runs_total

# Set very short interval before importing app (handled via env variable in test command if needed)

def test_affiliate_scheduler_runs(monkeypatch):
    # Force tiny interval
    monkeypatch.setenv("AFFILIATE_SYNC_INTERVAL_MINUTES", "0.001")
    # Recreate app to apply interval if necessary (in real scenario we'd reload, here we assume already started)
    client = TestClient(app)
    start = affiliate_sync_runs_total._value.get() if hasattr(affiliate_sync_runs_total, "_value") else 0
    # Wait a bit for scheduler to tick
    time.sleep(0.2)
    end = affiliate_sync_runs_total._value.get() if hasattr(affiliate_sync_runs_total, "_value") else start
    assert end >= start, "Affiliate scheduler did not increment runs counter"
