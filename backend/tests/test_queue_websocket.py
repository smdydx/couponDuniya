from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_queue_websocket_receives_stats():
    with client.websocket_connect("/api/v1/realtime/queue/ws") as ws:
        message = ws.receive_json()
        assert message["type"] == "queue_stats"
        assert "email" in message["data"]
        assert "sms" in message["data"]
