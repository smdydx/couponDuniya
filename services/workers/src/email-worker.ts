import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const QUEUE_NAME = "queue:email";
const DLQ_NAME = "queue:email:dlq";
const PROCESSING_SET = "queue:email:processing";
const MAX_RETRIES = 3;
const RETRY_DELAY = 60000; // 1 minute

interface EmailJob {
  id: string;
  type: string;
  to: string;
  data: any;
  attempts?: number;
  createdAt?: string;
}

async function sendEmail(job: EmailJob): Promise<void> {
  console.log(`📧 Sending ${job.type} email to ${job.to}`);

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[DEV] SendGrid API key not configured - email logged only");
    console.log(`[DEV] Email: ${job.to} - ${getEmailSubject(job.type)}`);
    return;
  }

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: job.to }] }],
      from: { email: process.env.FROM_EMAIL || "noreply@couponali.com" },
      subject: getEmailSubject(job.type),
      content: [{ type: "text/html", value: getEmailTemplate(job.type, job.data) }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error (${response.status}): ${error}`);
  }

  console.log(`✅ Email sent successfully to ${job.to}`);
}

function getEmailSubject(type: string): string {
  const subjects: Record<string, string> = {
    welcome: "Welcome to CouponCommerce!",
    order_confirmation: "Order Confirmed - Your Vouchers",
    cashback_confirmed: "Cashback Credited to Your Wallet",
    withdrawal_processed: "Withdrawal Processed Successfully",
  };
  return subjects[type] || "Notification";
}

function getEmailTemplate(type: string, data: any): string {
  const templates: Record<string, string> = {
    welcome: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4F46E5;">Welcome to CouponAli! 🎉</h1>
        <p>Hi ${data.user_name || 'there'},</p>
        <p>Thank you for joining CouponAli - India's best cashback & coupon platform!</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Get Started:</h3>
          <ul>
            <li>Browse 1000+ stores and offers</li>
            <li>Get cashback on every purchase</li>
            <li>Redeem your earnings via UPI/Bank</li>
          </ul>
        </div>
        ${data.verification_url ? `
          <div style="background: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Verify Your Email</h3>
            <p>Click the button below to verify your email address:</p>
            <a href="${data.verification_url}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">Verify Email</a>
            <p style="font-size: 12px; color: #666;">Link expires in 24 hours</p>
          </div>
        ` : ''}
        <p>Happy saving!<br>Team CouponAli</p>
      </div>
    `,
    order_confirmation: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Order Confirmed! ✅</h1>
        <p>Hi ${data.user_name},</p>
        <p>Your order <strong>${data.order_number}</strong> has been confirmed.</p>
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order Number:</strong> ${data.order_number}</p>
          <p><strong>Total Amount:</strong> ₹${data.total_amount}</p>
          <p><strong>Items:</strong> ${data.items_count || 1}</p>
        </div>
        <p><a href="${data.order_url}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order & Vouchers</a></p>
        <p style="margin-top: 30px;">Thank you for your purchase!<br>Team CouponAli</p>
      </div>
    `,
    cashback_confirmed: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10B981;">Cashback Credited! 💰</h1>
        <p>Hi ${data.user_name},</p>
        <p>Great news! Your cashback has been credited to your wallet.</p>
        <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #059669; margin: 0;">₹${data.amount}</h2>
          <p style="margin: 5px 0 0 0;">Cashback from ${data.merchant_name}</p>
        </div>
        <p><strong>New Wallet Balance:</strong> ₹${data.wallet_balance}</p>
        <p><a href="${process.env.APP_URL}/wallet" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Wallet</a></p>
      </div>
    `,
    withdrawal_processed: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6366F1;">Withdrawal Processed! 🎉</h1>
        <p>Hi ${data.user_name},</p>
        <p>Your withdrawal request has been processed successfully.</p>
        <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Withdrawal Details:</h3>
          <p><strong>Amount:</strong> ₹${data.amount}</p>
          <p><strong>Method:</strong> ${data.method}</p>
          <p><strong>Account:</strong> ${data.account_details}</p>
          ${data.transaction_id ? `<p><strong>Transaction ID:</strong> ${data.transaction_id}</p>` : ''}
        </div>
        <p>The amount will be credited to your account within 24-48 hours.</p>
        <p><a href="${process.env.APP_URL}/wallet" style="background: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Wallet History</a></p>
      </div>
    `,
  };

  return templates[type] || `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>CouponAli Notification</h1>
      <p>${JSON.stringify(data, null, 2)}</p>
    </div>
  `;
}

async function processJob(jobData: string): Promise<void> {
  const job: EmailJob = JSON.parse(jobData);
  job.attempts = (job.attempts || 0) + 1;

  try {
    await sendEmail(job);
    // Job succeeded - remove from processing set
    await redis.srem(PROCESSING_SET, jobData);
  } catch (error) {
    console.error(`❌ Error sending email ${job.id}:`, error);

    // Check if we should retry
    if (job.attempts < MAX_RETRIES) {
      // Re-queue with delay
      console.log(`⏳ Retrying email ${job.id} (attempt ${job.attempts + 1}/${MAX_RETRIES})`);
      await redis.srem(PROCESSING_SET, jobData);
      
      // Push back to queue after delay
      setTimeout(async () => {
        await redis.rpush(QUEUE_NAME, JSON.stringify(job));
      }, RETRY_DELAY);
    } else {
      // Max retries reached - move to dead letter queue
      console.error(`💀 Moving email ${job.id} to DLQ after ${MAX_RETRIES} attempts`);
      await redis.srem(PROCESSING_SET, jobData);
      await redis.rpush(DLQ_NAME, JSON.stringify({
        ...job,
        failedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }
}

async function processEmailQueue(): Promise<void> {
  console.log("📧 Email worker started - listening on Redis queue:", QUEUE_NAME);
  console.log("📧 Dead letter queue:", DLQ_NAME);

  while (true) {
    try {
      // BLPOP with 5 second timeout
      const result = await redis.blpop(QUEUE_NAME, 5);

      if (result) {
        const [, jobData] = result;
        
        // Add to processing set for crash recovery
        await redis.sadd(PROCESSING_SET, jobData);
        
        // Process the job
        await processJob(jobData);
      }
    } catch (error) {
      console.error("❌ Queue processing error:", error);
      await Bun.sleep(5000);
    }
  }
}

// Crash recovery: reprocess jobs that were being processed when worker crashed
async function recoverCrashedJobs(): Promise<void> {
  const crashedJobs = await redis.smembers(PROCESSING_SET);
  
  if (crashedJobs.length > 0) {
    console.log(`🔄 Recovering ${crashedJobs.length} crashed jobs...`);
    
    for (const jobData of crashedJobs) {
      await redis.srem(PROCESSING_SET, jobData);
      await redis.rpush(QUEUE_NAME, jobData);
    }
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down email worker gracefully...");
  await redis.quit();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down email worker gracefully...");
  await redis.quit();
  process.exit(0);
});

// Start worker
recoverCrashedJobs().then(() => {
  processEmailQueue();
});

