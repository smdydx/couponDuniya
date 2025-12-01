import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const QUEUE = process.env.SMS_QUEUE || "queue:sms";
const DLQ = `${QUEUE}:dlq`;
const PROCESSING = `${QUEUE}:processing`;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 60_000;

interface SmsJob {
  id: string;
  type: string;
  mobile: string;
  data: Record<string, unknown>;
  attempts?: number;
}

type SmsType = "otp" | "order_confirmation" | "cashback_credited" | "withdrawal_processed";

function getSmsTemplate(type: string, data: Record<string, unknown>): string {
  const templates: Record<SmsType, (d: Record<string, unknown>) => string> = {
    otp: (d) => `Your OTP for BIDUA Coupon is ${d.otp}. Valid for 10 minutes. Do not share with anyone.`,
    order_confirmation: (d) =>
      `Order ${d.order_number} confirmed! Amount: ₹${d.amount}. Your voucher codes are ready. Check your email or app.`,
    cashback_credited: (d) =>
      `₹${d.amount} cashback credited to your BIDUA wallet from ${d.merchant_name}. Total balance: ₹${d.wallet_balance}`,
    withdrawal_processed: (d) =>
      `Withdrawal of ₹${d.amount} processed successfully. It will be credited to your account within 24 hours.`,
  };
  const fn = templates[type as SmsType];
  return fn ? fn(data) : `BIDUA Coupon: ${JSON.stringify(data)}`;
}

async function sendSms(job: SmsJob): Promise<void> {
  const message = getSmsTemplate(job.type, job.data);
  console.log(`Sending ${job.type} SMS to ${job.mobile}: ${message}`);

  if (process.env.NODE_ENV === "development" || !process.env.MSG91_AUTH_KEY) {
    return;
  }

  const response = await fetch("https://api.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: {
      authkey: process.env.MSG91_AUTH_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      sender: process.env.MSG91_SENDER_ID || "COUPON",
      mobiles: job.mobile.replace(/^\+91/, ""),
      VAR1: message,
      ...job.data,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MSG91 error: ${response.status} - ${error}`);
  }
}

async function processJob(raw: string) {
  const job = JSON.parse(raw) as SmsJob;
  const attempts = job.attempts || 0;

  try {
    await sendSms(job);
    await redis.srem(PROCESSING, raw);
  } catch (err) {
    console.error(`Failed SMS ${job.id}:`, err);
    await redis.srem(PROCESSING, raw);

    if (attempts + 1 >= MAX_RETRIES) {
      await redis.rpush(
        DLQ,
        JSON.stringify({
          ...job,
          failedAt: new Date().toISOString(),
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      return;
    }

    const retryJob = { ...job, attempts: attempts + 1 };
    setTimeout(() => {
      redis.rpush(QUEUE, JSON.stringify(retryJob)).catch(console.error);
    }, RETRY_DELAY_MS);
  }
}

async function workerLoop() {
  console.log(`📱 SMS worker listening on ${QUEUE}`);
  while (true) {
    try {
      const res = await redis.blpop(QUEUE, 5);
      if (!res) continue;
      const [, raw] = res;
      await redis.sadd(PROCESSING, raw);
      await processJob(raw);
    } catch (err) {
      console.error("SMS worker loop error:", err);
      await Bun.sleep(3000);
    }
  }
}

async function recover() {
  const crashed = await redis.smembers(PROCESSING);
  if (crashed.length) {
    console.log(`Recovering ${crashed.length} SMS jobs`);
    for (const raw of crashed) {
      await redis.srem(PROCESSING, raw);
      await redis.rpush(QUEUE, raw);
    }
  }
}

process.on("SIGINT", async () => {
  await redis.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await redis.quit();
  process.exit(0);
});

recover().then(workerLoop);
