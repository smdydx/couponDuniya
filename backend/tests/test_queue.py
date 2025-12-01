"""Tests for Redis queue system."""
import json
import time
import pytest
from app.redis_client import rk
from app.queue import (
    push_email_job,
    push_sms_job,
    get_queue_stats,
    get_dead_letter_jobs,
    retry_dead_letter_job,
    clear_dead_letter_queue,
)


class TestQueueOperations:
    """Test queue push/pop operations."""

    def test_push_email_job(self, redis_client):
        """Test pushing email job to queue."""
        job_id = push_email_job(
            "welcome",
            "test@example.com",
            {"user_name": "Test User", "referral_code": "TEST123"},
        )

        assert job_id.startswith("email_")

        # Verify job in queue
        queue_length = redis_client.llen(rk("queue", "email"))
        assert queue_length == 1

        # Verify job structure
        job_data = redis_client.lpop(rk("queue", "email"))
        job = json.loads(job_data)
        assert job["id"] == job_id
        assert job["type"] == "welcome"
        assert job["to"] == "test@example.com"
        assert job["data"]["user_name"] == "Test User"
        assert job["attempts"] == 0

    def test_push_sms_job(self, redis_client):
        """Test pushing SMS job to queue."""
        job_id = push_sms_job(
            "otp", "+919876543210", {"otp": "123456"}
        )

        assert job_id.startswith("sms_")

        # Verify job in queue
        queue_length = redis_client.llen(rk("queue", "sms"))
        assert queue_length == 1

        # Verify job structure
        job_data = redis_client.lpop(rk("queue", "sms"))
        job = json.loads(job_data)
        assert job["type"] == "otp"
        assert job["mobile"] == "+919876543210"
        assert job["data"]["otp"] == "123456"

    def test_custom_job_id(self, redis_client):
        """Test pushing job with custom ID."""
        custom_id = "custom_email_12345"
        job_id = push_email_job(
            "test", "test@example.com", {}, job_id=custom_id
        )

        assert job_id == custom_id


class TestQueueStats:
    """Test queue statistics and monitoring."""

    def test_get_queue_stats_empty(self, redis_client):
        """Test stats for empty queues."""
        stats = get_queue_stats()

        assert stats["email"]["pending"] == 0
        assert stats["email"]["processing"] == 0
        assert stats["email"]["dead_letter"] == 0
        assert stats["sms"]["pending"] == 0

    def test_get_queue_stats_with_jobs(self, redis_client):
        """Test stats with pending jobs."""
        # Push 3 email jobs
        for i in range(3):
            push_email_job("test", f"user{i}@example.com", {})

        # Push 2 SMS jobs
        for i in range(2):
            push_sms_job("test", f"+91987654321{i}", {})

        stats = get_queue_stats()
        assert stats["email"]["pending"] == 3
        assert stats["sms"]["pending"] == 2

    def test_processing_set(self, redis_client):
        """Test processing set tracking."""
        # Simulate worker adding to processing set
        job_id = push_email_job("test", "test@example.com", {})
        job_data = redis_client.lpop(rk("queue", "email"))
        redis_client.sadd(rk("queue", "email", "processing"), job_data)

        stats = get_queue_stats()
        assert stats["email"]["processing"] == 1


class TestDeadLetterQueue:
    """Test dead letter queue functionality."""

    def test_get_dead_letter_jobs(self, redis_client):
        """Test retrieving failed jobs."""
        # Add jobs to DLQ
        failed_job = {
            "id": "failed_123",
            "type": "test",
            "to": "test@example.com",
            "data": {},
            "attempts": 3,
            "failedAt": "2025-01-01T00:00:00",
            "error": "Test error",
        }
        redis_client.rpush(rk("queue", "email", "dlq"), json.dumps(failed_job))

        # Retrieve DLQ jobs
        jobs = get_dead_letter_jobs("email")
        assert len(jobs) == 1
        assert jobs[0]["id"] == "failed_123"
        assert jobs[0]["error"] == "Test error"

    def test_retry_dead_letter_job(self, redis_client):
        """Test retrying failed job."""
        # Add failed job to DLQ
        failed_job = {
            "id": "retry_123",
            "type": "test",
            "to": "test@example.com",
            "data": {},
            "attempts": 3,
            "failedAt": "2025-01-01T00:00:00",
            "error": "Test error",
        }
        redis_client.rpush(rk("queue", "email", "dlq"), json.dumps(failed_job))

        # Retry the job
        success = retry_dead_letter_job("email", 0)
        assert success is True

        # Verify job moved to main queue
        assert redis_client.llen(rk("queue", "email", "dlq")) == 0
        assert redis_client.llen(rk("queue", "email")) == 1

        # Verify attempts reset
        job_data = redis_client.lpop(rk("queue", "email"))
        job = json.loads(job_data)
        assert job["attempts"] == 0
        assert "failedAt" not in job
        assert "error" not in job

    def test_retry_nonexistent_job(self, redis_client):
        """Test retrying non-existent job."""
        success = retry_dead_letter_job("email", 0)
        assert success is False

    def test_clear_dead_letter_queue(self, redis_client):
        """Test clearing entire DLQ."""
        # Add multiple failed jobs
        for i in range(5):
            failed_job = {"id": f"failed_{i}", "type": "test"}
            redis_client.rpush(rk("queue", "email", "dlq"), json.dumps(failed_job))

        # Clear DLQ
        count = clear_dead_letter_queue("email")
        assert count == 5
        assert redis_client.llen(rk("queue", "email", "dlq")) == 0


class TestQueueIntegration:
    """Integration tests for queue system."""

    def test_email_job_lifecycle(self, redis_client):
        """Test complete email job lifecycle."""
        # 1. Push job
        job_id = push_email_job("welcome", "user@example.com", {"user_name": "John"})

        # 2. Worker pops job
        job_data = redis_client.blpop(rk("queue", "email"), timeout=1)
        assert job_data is not None
        queue_name, job_json = job_data
        job = json.loads(job_json)

        # 3. Worker adds to processing set
        redis_client.sadd(rk("queue", "email", "processing"), job_json)

        # 4. Verify stats
        stats = get_queue_stats()
        assert stats["email"]["pending"] == 0
        assert stats["email"]["processing"] == 1

        # 5. Worker completes job
        redis_client.srem(rk("queue", "email", "processing"), job_json)

        # 6. Verify completion
        stats = get_queue_stats()
        assert stats["email"]["processing"] == 0

    def test_multiple_jobs_fifo(self, redis_client):
        """Test FIFO ordering of jobs."""
        # Push jobs in order
        job_ids = []
        for i in range(5):
            job_id = push_email_job("test", f"user{i}@example.com", {"index": i})
            job_ids.append(job_id)

        # Pop jobs and verify order
        for i in range(5):
            job_data = redis_client.lpop(rk("queue", "email"))
            job = json.loads(job_data)
            assert job["data"]["index"] == i

    def test_concurrent_queue_access(self, redis_client):
        """Test concurrent push operations."""
        import concurrent.futures

        def push_job(index):
            return push_email_job("test", f"user{index}@example.com", {})

        # Push 100 jobs concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            job_ids = list(executor.map(push_job, range(100)))

        # Verify all jobs queued
        assert len(job_ids) == 100
        assert redis_client.llen(rk("queue", "email")) == 100


@pytest.mark.asyncio
class TestQueuePerformance:
    """Performance tests for queue operations."""

    def test_push_performance(self, redis_client):
        """Test push operation performance."""
        start = time.time()
        for i in range(1000):
            push_email_job("test", f"user{i}@example.com", {})
        duration = time.time() - start

        # Should handle 1000 pushes in < 1 second
        assert duration < 1.0
        assert redis_client.llen(rk("queue", "email")) == 1000

    def test_stats_performance(self, redis_client):
        """Test stats retrieval performance."""
        # Add jobs to multiple queues
        for i in range(100):
            push_email_job("test", f"user{i}@example.com", {})
            push_sms_job("test", f"+91987654{i:04d}", {})

        start = time.time()
        for _ in range(100):
            get_queue_stats()
        duration = time.time() - start

        # Should handle 100 stat calls in < 100ms
        assert duration < 0.1
