import postgres from "postgres";
import { Redis } from "ioredis";

const sql = postgres(process.env.DATABASE_URL!);
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

type AffiliateStatus = "pending" | "approved" | "rejected" | "cancelled" | "hold";

interface AffiliateTransaction {
  network: "admitad" | "vcommission" | "cuelinks";
  id: string;
  subid: string; // our click/coupon tracking id
  actionDate: string;
  amount: number;
  status: AffiliateStatus;
  merchantName?: string;
  offerName?: string;
  currency?: string;
}

const STATUS_MAP: Record<string, AffiliateStatus> = {
  approved: "approved",
  confirmed: "approved",
  pending: "pending",
  hold: "pending",
  rejected: "rejected",
  declined: "rejected",
  cancelled: "cancelled",
};

/**
 * Fetch from Admitad API
 */
async function fetchAdmitad(): Promise<AffiliateTransaction[]> {
  const token = await getAdmitadToken();
  if (!token) {
    console.warn("[admitad] Missing token/creds; skipping.");
    return [];
  }
  const url = `https://api.admitad.com/statistics/actions/?date_start=${getDateDaysAgo(7)}&limit=200`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error("[admitad] API error", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  return (data.results || []).map((row: any) => ({
    network: "admitad",
    id: String(row.action_id || row.id),
    subid: String(row.subid || row.sub_id || ""),
    actionDate: row.action_date,
    amount: Number(row.payment_amount || row.payment || 0),
    status: normalizeStatus(row.payment_status || row.status),
    merchantName: row.campaign_name,
    offerName: row.tariff || row.link,
    currency: row.currency,
  }));
}

/**
 * Fetch from VCommission API
 */
async function fetchVCommission(): Promise<AffiliateTransaction[]> {
  if (!process.env.VCOMMISSION_TOKEN) {
    console.warn("[vcommission] Missing VCOMMISSION_TOKEN; skipping.");
    return [];
  }
  const url = `https://api.vcommission.com/transactions?from=${getDateDaysAgo(7)}&limit=200`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VCOMMISSION_TOKEN}` },
  });
  if (!res.ok) {
    console.error("[vcommission] API error", res.status, await res.text());
    return [];
  }
  const { data } = await res.json();
  return (data || []).map((row: any) => ({
    network: "vcommission",
    id: String(row.id),
    subid: String(row.subid || row.subid_one || ""),
    actionDate: row.datetime || row.date,
    amount: Number(row.sale_amount || row.payout || 0),
    status: normalizeStatus(row.status),
    merchantName: row.merchant_name,
    offerName: row.offer_name,
    currency: row.currency,
  }));
}

/**
 * Fetch from CueLinks API
 */
async function fetchCuelinks(): Promise<AffiliateTransaction[]> {
  if (!process.env.CUELINKS_API_KEY) {
    console.warn("[cuelinks] Missing CUELINKS_API_KEY; skipping.");
    return [];
  }
  const url = `https://api.cuelinks.com/transactions?start_date=${getDateDaysAgo(7)}&end_date=${getDateDaysAgo(0)}&limit=200`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.CUELINKS_API_KEY}` },
  });
  if (!res.ok) {
    console.error("[cuelinks] API error", res.status, await res.text());
    return [];
  }
  const { transactions } = await res.json();
  return (transactions || []).map((row: any) => ({
    network: "cuelinks",
    id: String(row.id),
    subid: String(row.sub_id || row.subid || ""),
    actionDate: row.date,
    amount: Number(row.commission || row.amount || 0),
    status: normalizeStatus(row.status),
    merchantName: row.merchant,
    offerName: row.campaign,
    currency: row.currency,
  }));
}

function normalizeStatus(raw: string | undefined): AffiliateStatus {
  if (!raw) return "pending";
  return STATUS_MAP[raw.toLowerCase()] || "pending";
}

async function getAdmitadToken(): Promise<string | null> {
  if (process.env.ADMITAD_ACCESS_TOKEN) return process.env.ADMITAD_ACCESS_TOKEN;
  const id = process.env.ADMITAD_CLIENT_ID;
  const secret = process.env.ADMITAD_CLIENT_SECRET;
  const scope = "statistics actions";
  if (!id || !secret) {
    return null;
  }
  const body = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: "client_credentials",
    scope,
  });
  const res = await fetch("https://api.admitad.com/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    console.error("[admitad] token error", res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data.access_token || null;
}

async function processTransactions(transactions: AffiliateTransaction[]): Promise<void> {
  for (const tx of transactions) {
    if (!tx.subid) {
      continue;
    }

    const [click] = await sql`
      SELECT * FROM offer_clicks
      WHERE click_id::text = ${tx.subid}
      LIMIT 1
    `;
    if (!click) continue;

    const [existing] = await sql`
      SELECT * FROM cashback_events
      WHERE affiliate_transaction_id = ${tx.id}
      LIMIT 1
    `;

    if (existing) {
      if (existing.status !== tx.status) {
        await sql`
          UPDATE cashback_events
          SET status = ${tx.status}, updated_at = NOW()
          WHERE id = ${existing.id}
        `;
        if (tx.status === "approved") {
          await creditCashbackToWallet(existing.id);
        }
      }
      continue;
    }

    const commissionAmount = tx.amount * 0.05;
    const cashbackAmount = tx.amount * 0.03;

    await sql`
      INSERT INTO cashback_events (
        user_id,
        offer_id,
        click_id,
        merchant_id,
        transaction_amount,
        commission_amount,
        cashback_amount,
        status,
        affiliate_transaction_id,
        network,
        meta
      )
      VALUES (
        ${click.user_id},
        ${click.offer_id},
        ${click.click_id},
        (SELECT merchant_id FROM offers WHERE id = ${click.offer_id}),
        ${tx.amount},
        ${commissionAmount},
        ${cashbackAmount},
        ${tx.status},
        ${tx.id},
        ${tx.network},
        ${JSON.stringify({
          merchantName: tx.merchantName,
          offerName: tx.offerName,
          currency: tx.currency,
        })}
      )
    `;

    if (tx.status === "approved") {
      const [created] = await sql`
        SELECT id FROM cashback_events WHERE affiliate_transaction_id = ${tx.id} LIMIT 1
      `;
      if (created?.id) {
        await creditCashbackToWallet(created.id);
      }
    }
  }
}

async function creditCashbackToWallet(cashbackEventId: number): Promise<void> {
  const [event] = await sql`
    SELECT * FROM cashback_events WHERE id = ${cashbackEventId}
  `;
  if (!event || event.paid_at) return;

  await sql`
    INSERT INTO wallet_transactions (
      user_id,
      amount,
      type,
      reference_type,
      reference_id,
      balance_before,
      balance_after,
      description
    )
    SELECT
      ${event.user_id},
      ${event.cashback_amount},
      'cashback_earned',
      'cashback_event',
      ${cashbackEventId},
      u.wallet_balance,
      u.wallet_balance + ${event.cashback_amount},
      'Cashback from ' || COALESCE(m.name, 'Unknown merchant')
    FROM users u
    LEFT JOIN merchants m ON m.id = ${event.merchant_id}
    WHERE u.id = ${event.user_id}
  `;

  await sql`
    UPDATE users
    SET
      wallet_balance = wallet_balance + ${event.cashback_amount},
      lifetime_earnings = lifetime_earnings + ${event.cashback_amount},
      updated_at = NOW()
    WHERE id = ${event.user_id}
  `;

  await sql`
    UPDATE cashback_events
    SET paid_at = NOW(), updated_at = NOW()
    WHERE id = ${cashbackEventId}
  `;

  // Queue cashback confirmation email via Redis
  const [user] = await sql`
    SELECT u.email, u.full_name, m.name as merchant_name
    FROM users u
    LEFT JOIN merchants m ON m.id = ${event.merchant_id}
    WHERE u.id = ${event.user_id}
  `;

  if (user?.email) {
    await redis.rpush(
      "queue:email",
      JSON.stringify({
        id: `cashback_${cashbackEventId}_${Date.now()}`,
        type: "cashback_confirmed",
        to: user.email,
        data: {
          user_name: user.full_name,
          amount: event.cashback_amount,
          merchant_name: user.merchant_name || "merchant",
        },
        attempts: 0,
        createdAt: new Date().toISOString(),
      })
    );
  }
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

async function runScheduledSync(): Promise<void> {
  while (true) {
    try {
      console.log("Starting cashback sync...");
      const allTxs: AffiliateTransaction[] = [];
      allTxs.push(...(await fetchAdmitad()));
      allTxs.push(...(await fetchVCommission()));
      allTxs.push(...(await fetchCuelinks()));
      console.log(`Fetched ${allTxs.length} affiliate transactions`);
      await processTransactions(allTxs);
      console.log("Cashback sync completed");
    } catch (error) {
      console.error("Error in cashback sync:", error);
    }

    const hours = Number(process.env.AFFILIATE_SYNC_INTERVAL_HOURS || 6);
    await Bun.sleep(hours * 60 * 60 * 1000);
  }
}

console.log("💰 Cashback sync worker started");
runScheduledSync();
