import postgres from "postgres";
import Redis from "ioredis";

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_MINUTE || "120", 10);
const RATE_WINDOW_SECONDS = 60;
const CLICK_QUEUE = process.env.CLICK_QUEUE || "queue:clicks";
const URL_CACHE_TTL = 300;

interface ClickParams {
  offerId: string;
  userId?: string;
  merchantId: string;
}

function parseClickUrl(pathname: string): ClickParams | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "out" || parts.length < 3) {
    return null;
  }

  return {
    merchantId: parts[1],
    offerId: parts[2],
    userId: parts[3] || undefined,
  };
}

async function getOfferRedirectUrl(offerId: string): Promise<string | null> {
  const cacheKey = `redirect:url:${offerId}`;
  const cached = await redis.get(cacheKey);
  if (cached) {
    return cached;
  }

  const [offer] = await sql`
    SELECT o.affiliate_url, m.tracking_url_template, m.affiliate_id
    FROM offers o
    JOIN merchants m ON o.merchant_id = m.id
    WHERE o.uuid = ${offerId}
      AND o.deleted_at IS NULL
      AND o.is_verified = true
      AND (o.expires_at IS NULL OR o.expires_at > NOW())
    LIMIT 1
  `;

  if (!offer) return null;

  if (offer.affiliate_url) {
    const url = offer.affiliate_url as string;
    await redis.setex(cacheKey, URL_CACHE_TTL, url);
    return url;
  }

  if (offer.tracking_url_template) {
    const url = (offer.tracking_url_template as string).replace(
      "{affiliate_id}",
      (offer.affiliate_id as string | null) || "",
    );
    await redis.setex(cacheKey, URL_CACHE_TTL, url);
    return url;
  }

  return null;
}

async function logClick(params: ClickParams, request: Request): Promise<void> {
  const userAgent = request.headers.get("user-agent") || "";
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "";
  const referrer = request.headers.get("referer") || "";
  const payload = {
    ...params,
    ua: userAgent,
    ip,
    referrer,
    ts: Date.now(),
  };

  // Push to Redis queue; if fails, fall back to direct write
  try {
    await redis.rpush(CLICK_QUEUE, JSON.stringify(payload));
    return;
  } catch (err) {
    console.warn("Redis unavailable, falling back to direct DB logging", err);
  }

  let deviceType = "desktop";
  if (/mobile/i.test(userAgent)) deviceType = "mobile";
  else if (/tablet/i.test(userAgent)) deviceType = "tablet";

  try {
    await sql`
      INSERT INTO offer_clicks (
        offer_id,
        user_id,
        ip_address,
        user_agent,
        referrer_url,
        device_type
      )
      SELECT
        o.id,
        ${params.userId ? parseInt(params.userId) : null},
        ${ip}::inet,
        ${userAgent},
        ${referrer},
        ${deviceType}
      FROM offers o
      WHERE o.uuid = ${params.offerId}
    `;

    await sql`
      UPDATE offers
      SET clicks_count = clicks_count + 1
      WHERE uuid = ${params.offerId}
    `;
  } catch (error) {
    console.error("Error logging click:", error);
  }
}

async function rateLimit(ip: string): Promise<boolean> {
  const key = `rl:redirect:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, RATE_WINDOW_SECONDS);
  }
  return count <= RATE_LIMIT;
}

const server = Bun.serve({
  port: process.env.PORT || 3001,
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

  if (url.pathname === "/health") {
    return new Response("OK", { status: 200 });
  }

  const params = parseClickUrl(url.pathname);
  if (!params) {
    return new Response("Invalid redirect URL", { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-client-ip") ||
    request.headers.get("remote-addr") ||
    "unknown";

  const allowed = await rateLimit(ip);
  if (!allowed) {
    return new Response("Rate limit exceeded", { status: 429 });
  }

  const redirectUrl = await getOfferRedirectUrl(params.offerId);
  if (!redirectUrl) {
    return new Response("Offer not found or expired", { status: 404 });
  }

    logClick(params, request).catch(console.error);

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  },
  error(error: Error): Response {
    console.error("Server error:", error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`🚀 Redirector service running on http://localhost:${server.port}`);
