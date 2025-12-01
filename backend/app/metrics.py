from prometheus_client import Counter, Histogram, Gauge

# Custom application metrics
http_requests_total = Counter(
    "app_http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"]
)

http_request_duration_seconds = Histogram(
    "app_http_request_duration_seconds",
    "HTTP request latency",
    ["method", "path"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5)
)

queue_jobs_enqueued_total = Counter(
    "app_queue_jobs_enqueued_total",
    "Jobs enqueued per queue",
    ["queue"]
)

queue_dead_letter_depth = Gauge(
    "app_queue_dead_letter_depth",
    "Dead letter queue depth",
    ["queue"]
)

redis_memory_bytes = Gauge(
    "app_redis_memory_bytes",
    "Redis used memory bytes"
)

# Affiliate sync metrics
affiliate_sync_runs_total = Counter(
    "app_affiliate_sync_runs_total",
    "Total affiliate sync executions"
)

affiliate_transactions_imported_total = Counter(
    "app_affiliate_transactions_imported_total",
    "Total affiliate transactions imported"
)

affiliate_transactions_updated_total = Counter(
    "app_affiliate_transactions_updated_total",
    "Total affiliate transactions updated"
)

affiliate_transactions_fetched_total = Counter(
    "app_affiliate_transactions_fetched_total",
    "Total raw affiliate transactions fetched before dedupe"
)

# Helper update functions

def observe_request(method: str, path: str, status: int, duration: float):
    # Collapse long dynamic path segments for cardinality control
    simplified = path
    if simplified.count('/') > 3:
        segments = simplified.split('/')
        simplified = '/'.join(segments[:3] + ['...'])
    http_requests_total.labels(method=method, path=simplified, status=str(status)).inc()
    http_request_duration_seconds.labels(method=method, path=simplified).observe(duration)


def increment_queue(queue: str):
    queue_jobs_enqueued_total.labels(queue=queue).inc()


def set_dead_letter(queue: str, depth: int):
    queue_dead_letter_depth.labels(queue=queue).set(depth)


def set_redis_memory(bytes_used: int):
    redis_memory_bytes.set(bytes_used)


def observe_affiliate_sync(imported: int, updated: int, total_fetched: int):
    """Record metrics for an affiliate sync run."""
    affiliate_sync_runs_total.inc()
    if imported:
        affiliate_transactions_imported_total.inc(imported)
    if updated:
        affiliate_transactions_updated_total.inc(updated)
    if total_fetched:
        affiliate_transactions_fetched_total.inc(total_fetched)
