"""Tests for health endpoints"""
import pytest
from fastapi.testclient import TestClient


class TestHealthCheck:
    """Test basic health endpoint"""
    
    def test_health_endpoint(self, client):
        """Health endpoint returns status"""
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ["healthy", "degraded"]
        assert "database" in data
        assert data["service"] == "coupon-commerce-api"


class TestRedisHealth:
    """Test Redis health and queue stats"""
    
    def test_redis_health_endpoint(self, client, redis_client):
        """Redis health endpoint returns queue statistics"""
        resp = client.get("/api/v1/health/redis")
        assert resp.status_code == 200
        data = resp.json()
        
        assert data["status"] in ["healthy", "unhealthy"]
        
        if data["status"] == "healthy":
            assert data["redis"] == "connected"
            assert "queues" in data
            assert "email" in data["queues"]
            assert "sms" in data["queues"]
            assert "total" in data
            
            # Verify structure
            for queue_type in ["email", "sms"]:
                queue_data = data["queues"][queue_type]
                assert "pending" in queue_data
                assert "processing" in queue_data
                assert "dead_letter" in queue_data
                assert isinstance(queue_data["pending"], int)
                assert isinstance(queue_data["processing"], int)
                assert isinstance(queue_data["dead_letter"], int)
            
            # Verify totals
            assert "pending" in data["total"]
            assert "processing" in data["total"]
            assert "dead_letter" in data["total"]
