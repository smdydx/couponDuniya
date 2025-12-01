# Redis Architecture & Usage Guide

## 🚀 Why Redis is Essential for This Platform

Redis provides **ultra-fast in-memory caching** that will:
- ⚡ Speed up API responses by 10-100x
- 🔐 Store sessions & JWTs securely
- 📊 Handle real-time data (hot offers, trending merchants)
- 🎯 Implement rate limiting
- 📧 Manage job queues (emails, SMS)
- 🔄 Cache expensive database queries

---

## 📦 Redis Use Cases in Your Platform

### **1. Session Management**
Store user sessions instead of database lookups

### **2. OTP Storage**
Temporary OTP codes with auto-expiry

### **3. Rate Limiting**
Prevent API abuse (max 100 requests/min)

### **4. Hot Data Caching**
Cache frequently accessed data (top offers, merchants)

### **5. Job Queues**
Background tasks (email sending, cashback sync)

### **6. Real-time Analytics**
Track clicks, views, conversions in real-time

---

## 🏗️ Redis Data Structures Used

| Structure | Use Case | Example |
|-----------|----------|---------|
| **String** | Simple cache, counters | User session, API rate limit |
| **Hash** | Object storage | User profile cache, offer details |
| **List** | Queues | Email queue, SMS queue |
| **Set** | Unique items | Trending offer IDs, active users |
| **Sorted Set** | Leaderboards, rankings | Top merchants by clicks |
| **Expiry (TTL)** | Auto-cleanup | OTP (5 min), cache (1 hour) |

---

## 💻 Implementation Examples

### **Setup Redis Client (Python - FastAPI Backend)**

```python
# backend/app/core/redis.py
import redis.asyncio as redis
from typing import Optional
import json
from datetime import timedelta

class RedisClient:
    def __init__(self):
        self.redis: Optional[redis.Redis] = None
    
    async def connect(self):
        """Connect to Redis on startup"""
        self.redis = await redis.from_url(
            "redis://localhost:6379",
            encoding="utf-8",
            decode_responses=True,
            max_connections=50
        )
        print("✅ Redis connected")
    
    async def disconnect(self):
        """Close Redis connection on shutdown"""
        if self.redis:
            await self.redis.close()
            print("❌ Redis disconnected")
    
    # ---------- STRING OPERATIONS ----------
    
    async def set(self, key: str, value: str, expire: int = None):
        """Set a key-value pair with optional expiry (seconds)"""
        if expire:
            await self.redis.setex(key, expire, value)
        else:
            await self.redis.set(key, value)
    
    async def get(self, key: str) -> Optional[str]:
        """Get value by key"""
        return await self.redis.get(key)
    
    async def delete(self, key: str):
        """Delete a key"""
        await self.redis.delete(key)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        return await self.redis.exists(key) > 0
    
    # ---------- HASH OPERATIONS ----------
    
    async def hset(self, name: str, key: str, value: str):
        """Set hash field"""
        await self.redis.hset(name, key, value)
    
    async def hget(self, name: str, key: str) -> Optional[str]:
        """Get hash field"""
        return await self.redis.hget(name, key)
    
    async def hgetall(self, name: str) -> dict:
        """Get all hash fields"""
        return await self.redis.hgetall(name)
    
    async def hdel(self, name: str, key: str):
        """Delete hash field"""
        await self.redis.hdel(name, key)
    
    # ---------- LIST OPERATIONS (Queues) ----------
    
    async def lpush(self, key: str, *values):
        """Push to left of list (queue)"""
        await self.redis.lpush(key, *values)
    
    async def rpush(self, key: str, *values):
        """Push to right of list"""
        await self.redis.rpush(key, *values)
    
    async def lpop(self, key: str) -> Optional[str]:
        """Pop from left of list"""
        return await self.redis.lpop(key)
    
    async def rpop(self, key: str) -> Optional[str]:
        """Pop from right of list"""
        return await self.redis.rpop(key)
    
    async def llen(self, key: str) -> int:
        """Get list length"""
        return await self.redis.llen(key)
    
    # ---------- SET OPERATIONS ----------
    
    async def sadd(self, key: str, *members):
        """Add members to set"""
        await self.redis.sadd(key, *members)
    
    async def smembers(self, key: str) -> set:
        """Get all set members"""
        return await self.redis.smembers(key)
    
    async def sismember(self, key: str, member: str) -> bool:
        """Check if member in set"""
        return await self.redis.sismember(key, member)
    
    # ---------- SORTED SET OPERATIONS ----------
    
    async def zadd(self, key: str, mapping: dict):
        """Add to sorted set {member: score}"""
        await self.redis.zadd(key, mapping)
    
    async def zrange(self, key: str, start: int, end: int, desc: bool = False) -> list:
        """Get range from sorted set"""
        return await self.redis.zrange(key, start, end, desc=desc)
    
    async def zincrby(self, key: str, amount: float, member: str):
        """Increment score in sorted set"""
        await self.redis.zincrby(key, amount, member)
    
    # ---------- UTILITY METHODS ----------
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment a counter"""
        return await self.redis.incr(key, amount)
    
    async def decrement(self, key: str, amount: int = 1) -> int:
        """Decrement a counter"""
        return await self.redis.decr(key, amount)
    
    async def expire(self, key: str, seconds: int):
        """Set expiry on existing key"""
        await self.redis.expire(key, seconds)
    
    async def ttl(self, key: str) -> int:
        """Get remaining TTL (-1 = no expiry, -2 = doesn't exist)"""
        return await self.redis.ttl(key)

# Global instance
redis_client = RedisClient()
```

---

### **Initialize in FastAPI App**

```python
# backend/app/main.py
from fastapi import FastAPI
from app.core.redis import redis_client

app = FastAPI()

@app.on_event("startup")
async def startup():
    await redis_client.connect()

@app.on_event("shutdown")
async def shutdown():
    await redis_client.disconnect()
```

---

## 🔐 Use Case 1: Session Management

### **Store Session on Login**

```python
# backend/app/api/v1/auth.py
from app.core.redis import redis_client
import json

@router.post("/login")
async def login(credentials: LoginSchema, db: Session):
    # Validate credentials...
    user = get_user(credentials.email)
    
    # Generate JWT token
    access_token = create_access_token(user.id)
    
    # Store session in Redis
    session_key = f"session:{access_token}"
    session_data = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "login_at": datetime.utcnow().isoformat()
    }
    
    # Store for 24 hours
    await redis_client.set(
        session_key,
        json.dumps(session_data),
        expire=86400  # 24 hours
    )
    
    return {"access_token": access_token, "user": user}
```

### **Validate Session on Protected Routes**

```python
# backend/app/core/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from app.core.redis import redis_client
import json

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security)
) -> dict:
    token = credentials.credentials
    session_key = f"session:{token}"
    
    # Check Redis first (fast)
    session_data = await redis_client.get(session_key)
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    return json.loads(session_data)

# Use in routes
@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user
```

### **Logout (Invalidate Session)**

```python
@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    session_key = f"session:{current_user['token']}"
    await redis_client.delete(session_key)
    return {"message": "Logged out successfully"}
```

---

## 📱 Use Case 2: OTP Storage & Verification

### **Generate & Store OTP**

```python
# backend/app/services/otp.py
import random
import string
from app.core.redis import redis_client

async def generate_otp(mobile: str) -> str:
    """Generate 6-digit OTP and store in Redis"""
    otp = ''.join(random.choices(string.digits, k=6))
    
    # Store OTP with 5 min expiry
    otp_key = f"otp:{mobile}"
    await redis_client.set(otp_key, otp, expire=300)  # 5 minutes
    
    # Track attempts to prevent brute force
    attempts_key = f"otp:attempts:{mobile}"
    await redis_client.increment(attempts_key)
    await redis_client.expire(attempts_key, 3600)  # Reset after 1 hour
    
    return otp

async def verify_otp(mobile: str, otp: str) -> bool:
    """Verify OTP"""
    # Check attempts
    attempts_key = f"otp:attempts:{mobile}"
    attempts = await redis_client.get(attempts_key)
    if attempts and int(attempts) > 5:
        raise Exception("Too many OTP attempts. Try again in 1 hour.")
    
    # Check OTP
    otp_key = f"otp:{mobile}"
    stored_otp = await redis_client.get(otp_key)
    
    if not stored_otp:
        return False
    
    if stored_otp == otp:
        # OTP correct, delete it
        await redis_client.delete(otp_key)
        await redis_client.delete(attempts_key)
        return True
    
    return False
```

### **API Endpoint**

```python
@router.post("/auth/request-otp")
async def request_otp(data: OTPRequestSchema):
    otp = await generate_otp(data.mobile)
    
    # Send OTP via SMS (MSG91, Kaleyra, etc.)
    await send_sms(data.mobile, f"Your OTP is: {otp}")
    
    return {"message": "OTP sent successfully"}

@router.post("/auth/verify-otp")
async def verify_otp_endpoint(data: OTPVerifySchema):
    is_valid = await verify_otp(data.mobile, data.otp)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Login user...
    return {"message": "OTP verified"}
```

---

## 🚦 Use Case 3: Rate Limiting

### **Prevent API Abuse**

```python
# backend/app/middleware/rate_limit.py
from fastapi import Request, HTTPException
from app.core.redis import redis_client

async def rate_limit_middleware(request: Request, call_next):
    """Allow max 100 requests per minute per IP"""
    
    # Skip rate limiting for health checks
    if request.url.path == "/health":
        return await call_next(request)
    
    # Get client IP
    client_ip = request.client.host
    
    # Redis key: rate_limit:<ip>
    key = f"rate_limit:{client_ip}"
    
    # Increment counter
    count = await redis_client.increment(key)
    
    # Set expiry on first request
    if count == 1:
        await redis_client.expire(key, 60)  # 60 seconds
    
    # Check limit
    if count > 100:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )
    
    # Add rate limit headers
    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = "100"
    response.headers["X-RateLimit-Remaining"] = str(100 - count)
    response.headers["X-RateLimit-Reset"] = str(await redis_client.ttl(key))
    
    return response

# Add to FastAPI app
app.middleware("http")(rate_limit_middleware)
```

---

## 📊 Use Case 4: Caching Expensive Queries

### **Cache Merchant Details**

```python
# backend/app/services/merchant.py
from app.core.redis import redis_client
import json

async def get_merchant_by_slug(slug: str, db: Session) -> dict:
    """Get merchant with Redis cache"""
    cache_key = f"merchant:{slug}"
    
    # Try Redis first
    cached = await redis_client.get(cache_key)
    if cached:
        print(f"✅ Cache HIT: {cache_key}")
        return json.loads(cached)
    
    # Cache MISS - query database
    print(f"❌ Cache MISS: {cache_key}")
    merchant = db.query(Merchant).filter(Merchant.slug == slug).first()
    
    if not merchant:
        return None
    
    # Convert to dict
    merchant_data = {
        "id": merchant.id,
        "name": merchant.name,
        "slug": merchant.slug,
        "logo_url": merchant.logo_url,
        "default_cashback_value": float(merchant.default_cashback_value),
        # ... other fields
    }
    
    # Cache for 1 hour
    await redis_client.set(
        cache_key,
        json.dumps(merchant_data),
        expire=3600
    )
    
    return merchant_data
```

### **Cache Top Offers**

```python
async def get_top_offers(db: Session) -> list:
    """Get top 10 offers with cache"""
    cache_key = "offers:top:10"
    
    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Query database
    offers = db.query(Offer)\
        .filter(Offer.is_verified == True)\
        .filter(Offer.expires_at > datetime.utcnow())\
        .order_by(Offer.clicks_count.desc())\
        .limit(10)\
        .all()
    
    offers_data = [serialize_offer(o) for o in offers]
    
    # Cache for 10 minutes (hot data changes frequently)
    await redis_client.set(
        cache_key,
        json.dumps(offers_data),
        expire=600
    )
    
    return offers_data
```

### **Invalidate Cache on Update**

```python
@router.put("/admin/merchants/{id}")
async def update_merchant(id: int, data: MerchantUpdateSchema, db: Session):
    merchant = db.query(Merchant).filter(Merchant.id == id).first()
    
    # Update merchant...
    merchant.name = data.name
    db.commit()
    
    # Invalidate cache
    await redis_client.delete(f"merchant:{merchant.slug}")
    
    return {"message": "Merchant updated"}
```

---

## 📧 Use Case 5: Job Queues (Email/SMS)

### **Queue Email Job**

```python
# backend/app/services/email_queue.py
from app.core.redis import redis_client
import json

async def queue_email(email_type: str, to: str, data: dict):
    """Add email to queue"""
    job = {
        "type": email_type,
        "to": to,
        "data": data,
        "queued_at": datetime.utcnow().isoformat()
    }
    
    # Push to Redis list
    await redis_client.rpush("queue:emails", json.dumps(job))
    
    print(f"📧 Queued {email_type} email to {to}")

# Usage
await queue_email(
    "order_confirmation",
    "user@example.com",
    {
        "order_number": "ORD-2025-001234",
        "total": 500.00,
        "items": [...]
    }
)
```

### **Worker to Process Queue**

```python
# services/workers/email_worker.py (Bun or Python)
import asyncio
import json
from app.core.redis import redis_client

async def process_email_queue():
    """Worker that processes email queue"""
    while True:
        # Pop job from queue (blocking with timeout)
        job_json = await redis_client.lpop("queue:emails")
        
        if not job_json:
            await asyncio.sleep(1)  # Wait 1 second
            continue
        
        job = json.loads(job_json)
        
        try:
            # Send email
            await send_email(job["type"], job["to"], job["data"])
            print(f"✅ Sent {job['type']} to {job['to']}")
        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            
            # Re-queue with retry count
            if "retry_count" not in job:
                job["retry_count"] = 0
            
            job["retry_count"] += 1
            
            if job["retry_count"] < 3:
                # Retry max 3 times
                await redis_client.rpush("queue:emails", json.dumps(job))

# Run worker
asyncio.run(process_email_queue())
```

---

## 📈 Use Case 6: Real-Time Analytics

### **Track Offer Clicks in Real-Time**

```python
# Increment click count instantly
async def track_offer_click(offer_id: int, user_id: int = None):
    # Increment total clicks
    await redis_client.increment(f"offer:{offer_id}:clicks")
    
    # Add to trending (sorted set by clicks)
    await redis_client.zincrby("offers:trending", 1, str(offer_id))
    
    # Track unique viewers (set)
    if user_id:
        await redis_client.sadd(f"offer:{offer_id}:viewers", str(user_id))
    
    # Store in database asynchronously (background task)
    # ...
```

### **Get Trending Offers**

```python
async def get_trending_offers(limit: int = 10) -> list:
    """Get top trending offers by click count"""
    # Get top offer IDs from sorted set
    offer_ids = await redis_client.zrange(
        "offers:trending",
        0,
        limit - 1,
        desc=True  # Highest to lowest
    )
    
    # Fetch offer details from cache or DB
    offers = []
    for offer_id in offer_ids:
        offer = await get_offer_by_id(int(offer_id))
        if offer:
            offers.append(offer)
    
    return offers
```

### **Get Live Stats Dashboard**

```python
@router.get("/admin/analytics/realtime")
async def get_realtime_analytics():
    """Get real-time dashboard stats"""
    
    # All from Redis (instant)
    return {
        "active_users": await redis_client.scard("users:active"),  # Set count
        "offers_clicked_today": await redis_client.get("stats:clicks:today") or 0,
        "orders_today": await redis_client.get("stats:orders:today") or 0,
        "top_merchants": await get_top_merchants_realtime(),
        "trending_offers": await get_trending_offers(5)
    }
```

---

## 🔄 Use Case 7: Distributed Locking

### **Prevent Race Conditions**

```python
# backend/app/core/lock.py
import asyncio
from app.core.redis import redis_client

class RedisLock:
    def __init__(self, key: str, timeout: int = 10):
        self.key = f"lock:{key}"
        self.timeout = timeout
        self.lock_value = None
    
    async def __aenter__(self):
        # Try to acquire lock
        import uuid
        self.lock_value = str(uuid.uuid4())
        
        for _ in range(50):  # Try 50 times (5 seconds)
            # SET if NOT EXISTS with expiry
            acquired = await redis_client.redis.set(
                self.key,
                self.lock_value,
                nx=True,  # Only set if not exists
                ex=self.timeout
            )
            
            if acquired:
                return self
            
            await asyncio.sleep(0.1)  # Wait 100ms
        
        raise Exception(f"Could not acquire lock: {self.key}")
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Release lock only if we own it
        current_value = await redis_client.get(self.key)
        if current_value == self.lock_value:
            await redis_client.delete(self.key)

# Usage: Prevent double-withdrawal
@router.post("/wallet/withdraw")
async def withdraw(amount: float, user: User = Depends(get_current_user)):
    async with RedisLock(f"withdraw:{user.id}"):
        # Check balance
        if user.wallet_balance < amount:
            raise HTTPException(400, "Insufficient balance")
        
        # Deduct balance
        user.wallet_balance -= amount
        db.commit()
        
        # Create withdrawal request
        # ...
```

---

## 🏆 Use Case 8: Leaderboard (Referral Rankings)

```python
async def update_referral_leaderboard(user_id: int, earnings: float):
    """Add/update user in referral leaderboard"""
    await redis_client.zincrby("leaderboard:referrals", earnings, str(user_id))

async def get_top_referrers(limit: int = 10) -> list:
    """Get top referrers"""
    user_ids = await redis_client.zrange(
        "leaderboard:referrals",
        0,
        limit - 1,
        desc=True,
        withscores=True
    )
    
    # Returns: [(user_id, score), ...]
    leaderboard = []
    for user_id, score in user_ids:
        user = await get_user_by_id(int(user_id))
        leaderboard.append({
            "rank": len(leaderboard) + 1,
            "user": user,
            "total_earnings": score
        })
    
    return leaderboard
```

---

## 🐳 Redis with Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: coupon_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: redis_ui
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis

volumes:
  redis_data:
```

**Run**:
```bash
docker-compose up -d redis
# Access Redis UI at http://localhost:8081
```

---

## 📊 Redis Key Naming Conventions

Use **hierarchical keys** with colons:

```
session:<token>                      # User session
otp:<mobile>                         # OTP
otp:attempts:<mobile>                # OTP retry count
rate_limit:<ip>                      # Rate limiting

cache:merchant:<slug>                # Merchant cache
cache:offer:<uuid>                   # Offer cache
cache:product:<slug>                 # Product cache

queue:emails                         # Email job queue
queue:sms                            # SMS job queue

offer:<id>:clicks                    # Offer click count
offer:<id>:viewers                   # Unique viewers (set)

offers:trending                      # Sorted set of trending offers
offers:top:10                        # Cached top 10 offers

users:active                         # Active users (set)
stats:clicks:today                   # Daily click counter
stats:orders:today                   # Daily order counter

leaderboard:referrals                # Referral earnings leaderboard

lock:withdraw:<user_id>              # Distributed lock
```

---

## 🚀 Performance Tips

### **1. Use Pipelining for Bulk Operations**
```python
# Bad: Multiple network calls
await redis_client.set("key1", "value1")
await redis_client.set("key2", "value2")
await redis_client.set("key3", "value3")

# Good: Single network call
pipe = redis_client.redis.pipeline()
pipe.set("key1", "value1")
pipe.set("key2", "value2")
pipe.set("key3", "value3")
await pipe.execute()
```

### **2. Set Appropriate TTLs**
```python
# Hot data: 5-10 minutes
await redis_client.set("offers:trending", data, expire=300)

# Warm data: 1 hour
await redis_client.set("merchant:amazon", data, expire=3600)

# Cold data: 24 hours
await redis_client.set("stats:monthly", data, expire=86400)

# Session: 7 days
await redis_client.set("session:xyz", data, expire=604800)
```

### **3. Monitor Memory Usage**
```python
# Get Redis info
info = await redis_client.redis.info("memory")
print(f"Used memory: {info['used_memory_human']}")
print(f"Max memory: {info['maxmemory_human']}")
```

---

## 🔒 Security Best Practices

1. **Never store sensitive data unencrypted**
   - Encrypt PII before caching
   - Don't cache credit card details

2. **Use strong passwords**
   ```bash
   # redis.conf
   requirepass your_strong_password_here
   ```

3. **Bind to localhost in development**
   ```bash
   bind 127.0.0.1 ::1
   ```

4. **Use SSL/TLS in production**
   ```python
   redis_client = redis.from_url(
       "rediss://username:password@host:6380",  # Note: rediss:// (with SSL)
       ssl_cert_reqs="required"
   )
   ```

---

## 📈 Production Setup (AWS ElastiCache)

```python
# Production config
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

redis_client = await redis.from_url(
    REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
    max_connections=50,
    socket_keepalive=True,
    socket_connect_timeout=5,
    health_check_interval=30
)
```

**Environment variables**:
```bash
# .env.production
REDIS_URL=redis://coupon-redis.cache.amazonaws.com:6379
```

---

## 🎯 Summary: Redis Usage in Your Platform

| Feature | Redis Structure | TTL | Notes |
|---------|----------------|-----|-------|
| User Sessions | String | 24h | JWT validation |
| OTP Storage | String | 5min | Auto-expire |
| Rate Limiting | String (counter) | 1min | Per IP/user |
| Merchant Cache | String (JSON) | 1h | Reduce DB load |
| Top Offers Cache | String (JSON) | 10min | Hot data |
| Email Queue | List | None | FIFO processing |
| Trending Offers | Sorted Set | 24h | Real-time ranking |
| Active Users | Set | Reset daily | Unique count |
| Leaderboard | Sorted Set | None | Rankings |
| Distributed Locks | String | 10s | Race prevention |

---

**With Redis, your platform will be 10-100x faster!** ⚡

Next: Implement caching in your FastAPI backend following the examples above.
