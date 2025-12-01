import postgres from "postgres";
import { Redis } from "ioredis";

const sql = postgres(process.env.DATABASE_URL!);
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const QUEUE = process.env.CLICK_QUEUE || "queue:clicks";
const PROCESSING_SET = `${QUEUE}:processing`;
const DLQ = `${QUEUE}:dlq`;

interface ClickJob {
  offerId: string;
  userId?: string;
  merchantId: string;
  ua: string;
  ip: string;
  referrer?: string;
  ts: number;
}

async function processJob(raw: string) {
  const job = JSON.parse(raw) as ClickJob;
  await sql.begin(async (trx) => {
    await trx`
      INSERT INTO offer_clicks (
        offer_id,
        user_id,
        ip_address,
        user_agent,
        referrer_url,
        device_type,
        clicked_at
      )
      SELECT
        o.id,
        ${job.userId ? parseInt(job.userId) : null},
        ${job.ip || ""}::inet,
        ${job.ua || ""},
        ${job.referrer || ""},
        CASE
          WHEN ${job.ua || ""} ILIKE '%mobile%' THEN 'mobile'
          WHEN ${job.ua || ""} ILIKE '%tablet%' THEN 'tablet'
          ELSE 'desktop'
        END,
        to_timestamp(${job.ts / 1000})
      FROM offers o
      WHERE o.uuid = ${job.offerId}
    `;

    await trx`
      UPDATE offers
      SET clicks_count = clicks_count + 1
      WHERE uuid = ${job.offerId}
    `;
  });
}

async function workerLoop() {
  console.log(`🎯 Click worker listening on ${QUEUE}`);
  while (true) {
    try {
      const res = await redis.blpop(QUEUE, 5);
      if (!res) {
        continue;
      }
      const [, raw] = res;
      await redis.sadd(PROCESSING_SET, raw);
      try {
        await processJob(raw);
        await redis.srem(PROCESSING_SET, raw);
      } catch (err) {
        console.error("Failed to process click job:", err);
        await redis.srem(PROCESSING_SET, raw);
        await redis.rpush(
          DLQ,
          JSON.stringify({
            raw,
            error: err instanceof Error ? err.message : String(err),
            failedAt: new Date().toISOString(),
          }),
        );
      }
    } catch (err) {
      console.error("Click worker loop error:", err);
      await Bun.sleep(2000);
    }
  }
}

async function recover() {
  const crashed = await redis.smembers(PROCESSING_SET);
  if (crashed.length) {
    console.log(`Recovering ${crashed.length} click jobs`);
    for (const raw of crashed) {
      await redis.srem(PROCESSING_SET, raw);
      await redis.rpush(QUEUE, raw);
    }
  }
}

process.on("SIGINT", async () => {
  await sql.end();
  await redis.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await sql.end();
  await redis.quit();
  process.exit(0);
});

recover().then(workerLoop);
