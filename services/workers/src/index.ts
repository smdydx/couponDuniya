/**
 * Workers Service Entry Point
 *
 * This file provides a unified entry point for running all workers
 * or individual workers based on command line arguments.
 *
 * Usage:
 *   bun src/index.ts          # Run all workers
 *   bun src/index.ts email    # Run email worker only
 *   bun src/index.ts sms      # Run SMS worker only
 *   bun src/index.ts cashback # Run cashback sync only
 */

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

// Import workers dynamically based on argument
const workerArg = process.argv[2];

console.log("🚀 BIDUA Coupon Workers Service");
console.log("================================");

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

async function startWorkers(): Promise<void> {
  // Check database connection first
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error("Exiting due to database connection failure");
    process.exit(1);
  }

  switch (workerArg) {
    case "email":
      console.log("\n📧 Starting Email Worker...");
      await import("./email-worker");
      break;

    case "sms":
      console.log("\n📱 Starting SMS Worker...");
      await import("./sms-worker");
      break;

    case "cashback":
      console.log("\n💰 Starting Cashback Sync Worker...");
      await import("./cashback-sync");
      break;

    case "clicks":
      console.log("\n🎯 Starting Click Worker...");
      await import("./click-worker");
      break;

    default:
      // Run all workers concurrently
      console.log("\n🔄 Starting all workers...\n");

      // Use Promise.all to run workers in parallel
      await Promise.all([
        import("./email-worker").then(() => console.log("📧 Email worker loaded")),
        import("./sms-worker").then(() => console.log("📱 SMS worker loaded")),
        import("./cashback-sync").then(() => console.log("💰 Cashback sync loaded")),
        import("./click-worker").then(() => console.log("🎯 Click worker loaded")),
      ]);

      console.log("\n✅ All workers running");
      break;
  }
}

// Health check endpoint
const healthServer = Bun.serve({
  port: process.env.WORKERS_HEALTH_PORT || 3003,
  fetch(request: Request): Response {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: "workers",
          worker: workerArg || "all",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (url.pathname === "/metrics") {
      // Basic metrics endpoint for monitoring
      return new Response(
        JSON.stringify({
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          worker: workerArg || "all",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`📊 Health check: http://localhost:${healthServer.port}/health`);

// Start workers
startWorkers().catch((error) => {
  console.error("Fatal error starting workers:", error);
  process.exit(1);
});

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down workers...");
  await sql.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down workers...");
  await sql.end();
  process.exit(0);
});
