const TelegramBot = require("node-telegram-bot-api");
const config = require("./config");
const { registerHandlers } = require("./handlers");
const { startReminderScheduler } = require("./utils/reminder");
const { initSchema, closePool } = require("./database/connection");

// ─── Initialize Bot ──────────────────────────────────────────────────
const bot = new TelegramBot(config.BOT_TOKEN, {
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4,
    },
  },
});

// ─── Start Application ──────────────────────────────────────────────
async function start() {
  // Initialize PostgreSQL schema
  await initSchema();

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  🏥 Clinic Referral Bot ishga tushdi!");
  console.log(`  🐘 Database: PostgreSQL`);
  console.log(`  👤 Admin ID: ${config.ADMIN_ID}`);
  console.log(`  🏥 Klinika: ${config.CLINIC_NAME}`);
  console.log(`  📞 Telefon: ${config.CLINIC_PHONE}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // ─── Register All Handlers ──────────────────────────────────────────
  registerHandlers(bot);

  // ─── Start Reminder Scheduler (kuniga 3 marta: 09:00, 12:00, 14:00) ─
  startReminderScheduler(bot);
}

start().catch((err) => {
  console.error("❌ Bot ishga tushmadi:", err);
  process.exit(1);
});

// ─── Error Handling ─────────────────────────────────────────────────
bot.on("polling_error", (error) => {
  console.error("Polling error:", error.code, error.message);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

// ─── Graceful Shutdown ──────────────────────────────────────────────
process.on("SIGINT", async () => {
  console.log("\n🔴 Bot to'xtatilmoqda...");
  bot.stopPolling();
  await closePool();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🔴 Bot to'xtatilmoqda...");
  bot.stopPolling();
  await closePool();
  process.exit(0);
});
