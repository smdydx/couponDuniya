# Redis Quick Reference - Coupon Commerce Platform

## 🚀 Common Redis Commands Cheat Sheet

### **Session Management**
```python
# Login - Store session
await redis_client.set(f"session:{token}", json.dumps(user_data), expire=86400)

# Validate - Check session
session = await redis_client.get(f"session:{token}")

# Logout - Delete session
await redis_client.delete(f"session:{token}")
```

### **OTP Management**
```python
# Generate OTP
otp = generate_6_digit_code()
await redis_client.set(f"otp:{mobile}", otp, expire=300)  # 5 min

# Verify OTP
stored_otp = await redis_client.get(f"otp:{mobile}")
if stored_otp == user_otp:
    await redis_client.delete(f"otp:{mobile}")
```

### **Rate Limiting**
```python
# Track API calls
count = await redis_client.increment(f"rate_limit:{ip}")
if count == 1:
    await redis_client.expire(f"rate_limit:{ip}", 60)
if count > 100:
    raise RateLimitError()
```

### **Caching**
```python
# Check cache first
cached = await redis_client.get(f"merchant:{slug}")
if cached:
    return json.loads(cached)

# Cache miss - query DB and cache
data = query_database()
await redis_client.set(f"merchant:{slug}", json.dumps(data), expire=3600)
```

### **Job Queue**
```python
# Producer: Add job
await redis_client.rpush("queue:emails", json.dumps(job))

# Consumer: Process job
job = await redis_client.lpop("queue:emails")
```

### **Real-time Counters**
```python
# Increment offer clicks
await redis_client.increment(f"offer:{id}:clicks")

# Add to trending (sorted set)
await redis_client.zincrby("offers:trending", 1, str(offer_id))

# Get trending
top_offers = await redis_client.zrange("offers:trending", 0, 9, desc=True)
```

---

## 📊 When to Use Redis vs PostgreSQL

| Scenario | Use | Reason |
|----------|-----|--------|
| User session after login | **Redis** | Fast, auto-expire |
| User profile data | **PostgreSQL** | Permanent storage |
| Merchant details (read-heavy) | **Redis (cache)** + PostgreSQL | Speed up reads |
| Offer click tracking | **Redis (counter)** → PostgreSQL (batch) | Real-time + persistence |
| OTP codes | **Redis only** | Temporary, auto-expire |
| Order data | **PostgreSQL** | Must persist |
| Email queue | **Redis** | Fast FIFO |
| Top 10 offers | **Redis (cache)** | Very hot data |

---

## ⚡ Performance Impact

| Without Redis | With Redis | Improvement |
|---------------|------------|-------------|
| Session validation: 50ms (DB query) | 2ms (Redis) | **25x faster** |
| Get merchant details: 100ms (DB) | 3ms (Redis cache) | **33x faster** |
| Get top offers: 200ms (DB + joins) | 5ms (Redis cache) | **40x faster** |
| Check rate limit: 30ms (DB) | 1ms (Redis counter) | **30x faster** |

---

## 🔑 Key Naming Best Practices

**Pattern**: `resource:identifier:field`

```
✅ Good:
session:abc123xyz
otp:+919876543210
cache:merchant:amazon
offer:123:clicks
queue:emails

❌ Bad:
user_session_abc123
otp_9876543210
amazon_merchant_cache
```

---

## 💾 Memory Management

**Estimate Redis memory needs**:

| Data Type | Count | Size per Item | Total |
|-----------|-------|---------------|-------|
| Sessions (active) | 1,000 | 1 KB | 1 MB |
| OTP codes | 100 | 50 B | 5 KB |
| Cached merchants | 500 | 2 KB | 1 MB |
| Cached offers | 1,000 | 1.5 KB | 1.5 MB |
| Job queues | 500 | 500 B | 250 KB |
| Counters/stats | 10,000 | 100 B | 1 MB |
| **Total** | | | **~5 MB** |

**For 10,000 active users**: ~50 MB  
**Recommended Redis size**: 256 MB (with headroom)

---

## 🐳 Quick Start with Docker

```bash
# Run Redis
docker run -d --name coupon-redis \
  -p 6379:6379 \
  redis:7-alpine

# Test connection
docker exec -it coupon-redis redis-cli ping
# Should return: PONG

# Set a key
docker exec -it coupon-redis redis-cli SET mykey "Hello Redis"

# Get a key
docker exec -it coupon-redis redis-cli GET mykey
```

---

## 🔍 Monitoring Redis

```python
# Get stats
info = await redis_client.redis.info()
print(f"Connected clients: {info['connected_clients']}")
print(f"Used memory: {info['used_memory_human']}")
print(f"Total commands: {info['total_commands_processed']}")
print(f"Keyspace hits: {info['keyspace_hits']}")
print(f"Keyspace misses: {info['keyspace_misses']}")

# Calculate cache hit rate
hit_rate = info['keyspace_hits'] / (info['keyspace_hits'] + info['keyspace_misses'])
print(f"Cache hit rate: {hit_rate * 100:.2f}%")
```

**Target**: > 90% cache hit rate

---

## 🛠️ Development vs Production

### **Development** (Local)
```python
REDIS_URL = "redis://localhost:6379"
```

### **Production** (AWS ElastiCache)
```python
REDIS_URL = "redis://coupon-redis.abc123.ng.0001.use1.cache.amazonaws.com:6379"
```

### **Production with Password**
```python
REDIS_URL = "redis://:password@host:6379"
```

---

## 📱 Frontend Integration

Redis is **backend-only**, but you can expose cached data via APIs:

```typescript
// frontend/src/lib/api/offers.ts
export async function getTrendingOffers() {
  // This endpoint uses Redis cache internally
  const response = await fetch('/api/offers/trending');
  return response.json();
  // Backend serves from Redis in 5ms instead of DB query (200ms)
}
```

---

## 🚨 Common Mistakes to Avoid

1. **❌ Storing large objects**
   - Don't cache huge lists (100KB+)
   - Use pagination, cache page-by-page

2. **❌ No TTL on cache**
   - Always set expiry
   - Prevents stale data and memory bloat

3. **❌ Not invalidating cache**
   - When data changes, delete cached version
   - `await redis_client.delete(cache_key)`

4. **❌ Using Redis as primary database**
   - Redis is volatile (can lose data)
   - Always persist critical data in PostgreSQL

5. **❌ Ignoring connection limits**
   - Set `max_connections` in client
   - Close connections properly

---

Ready to add Redis to your platform! Start with session management and OTP, then add caching. 🚀
