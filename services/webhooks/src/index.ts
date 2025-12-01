import { createHmac } from "crypto";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

function verifyRazorpaySignature(
  webhookBody: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = createHmac("sha256", secret).update(webhookBody).digest("hex");
  return expectedSignature === signature;
}

async function handlePaymentAuthorized(event: any): Promise<void> {
  const payment = event.payload.payment.entity;
  const orderId = payment.notes?.order_id;
  if (!orderId) {
    console.error("No order_id in payment notes");
    return;
  }

  await sql`
    UPDATE payments
    SET
      status = 'success',
      gateway_payment_id = ${payment.id},
      gateway_response = ${JSON.stringify(payment)},
      updated_at = NOW()
    WHERE gateway_order_id = ${payment.order_id}
  `;

  await sql`
    UPDATE orders
    SET
      payment_status = 'completed',
      status = 'processing',
      updated_at = NOW()
    WHERE id = ${orderId}
  `;

  await triggerOrderFulfillment(orderId);
}

async function handlePaymentFailed(event: any): Promise<void> {
  const payment = event.payload.payment.entity;

  await sql`
    UPDATE payments
    SET
      status = 'failed',
      error_message = ${payment.error_description || "Payment failed"},
      gateway_response = ${JSON.stringify(payment)},
      updated_at = NOW()
    WHERE gateway_order_id = ${payment.order_id}
  `;

  await sql`
    UPDATE orders
    SET
      payment_status = 'failed',
      status = 'failed',
      updated_at = NOW()
    WHERE id = (
      SELECT order_id FROM payments WHERE gateway_order_id = ${payment.order_id}
    )
  `;
}

async function triggerOrderFulfillment(orderId: string): Promise<void> {
  console.log(`Triggering fulfillment for order ${orderId}`);
  // TODO: call backend internal endpoint or queue a job
}

const server = Bun.serve({
  port: process.env.PORT || 3002,
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response("OK");
    }

    if (url.pathname === "/webhooks/razorpay") {
      const signature = request.headers.get("x-razorpay-signature");
      if (!signature) {
        return new Response("Missing signature", { status: 400 });
      }

      const body = await request.text();

      const isValid = verifyRazorpaySignature(body, signature, process.env.RAZORPAY_WEBHOOK_SECRET!);
      if (!isValid) {
        console.error("Invalid Razorpay signature");
        return new Response("Invalid signature", { status: 401 });
      }

      const event = JSON.parse(body);
      try {
        switch (event.event) {
          case "payment.authorized":
            await handlePaymentAuthorized(event);
            break;
          case "payment.failed":
            await handlePaymentFailed(event);
            break;
          default:
            console.log("Unhandled event:", event.event);
        }

        return new Response("OK");
      } catch (error) {
        console.error("Error handling webhook:", error);
        return new Response("Error processing webhook", { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🔔 Webhooks service running on http://localhost:${server.port}`);
